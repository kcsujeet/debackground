import { env, pipeline, type RawImage } from "@huggingface/transformers";
import { BACKGROUND_REMOVAL_MODEL_ID } from "../lib/constants";
import { aggregateProgress, type FileDownload } from "./download-progress";
import { firstResult } from "./pipeline-output";
import {
	BackendExhaustedError,
	describeError,
	runWithFallback,
} from "./run-with-fallback";
import {
	createWebGpuDevice,
	detectGpuCapabilities,
	type InferenceBackend,
	REQUIRED_STORAGE_BUFFERS_PER_STAGE,
	selectBackends,
} from "./select-backend";

// Safe detection of Cache API / IndexedDB availability
// Some mobile browsers or private modes disable these, which would cause errors if useBrowserCache is true
let isCacheAvailable = false;
try {
	isCacheAvailable =
		typeof caches !== "undefined" && typeof indexedDB !== "undefined";
} catch (_e) {
	isCacheAvailable = false;
}

env.useBrowserCache = isCacheAvailable;

if (!isCacheAvailable) {
	console.warn(
		"Browser cache/IndexedDB is not available. Models will be downloaded every session.",
	);
}

/**
 * The slice of the Transformers.js background-removal pipeline we use: called with
 * an image it returns one RGBA image per input, with the mask already applied as
 * the alpha channel.
 * @see https://huggingface.co/docs/transformers.js/en/api/pipelines
 */
interface BackgroundRemover {
	(image: Blob | string): Promise<RawImage | RawImage[]>;
	dispose(): Promise<void>;
}

/**
 * Structural supertype of the Transformers.js `ProgressInfo` union. That union is
 * declared in the package's internal `utils/core.d.ts` and is not re-exported from
 * the entry point, and `strictFunctionTypes` requires our callback parameter to be
 * a supertype of it rather than a narrower shape.
 */
interface ModelLoadProgress {
	status: string;
	file?: string;
	loaded?: number;
	total?: number;
}

interface RemovalResult {
	blob: Blob;
	backend: InferenceBackend;
	loadMs: number;
	inferMs: number;
}

/**
 * Narrowed view of `pipeline`. Letting TypeScript resolve the library's task-to-
 * pipeline map for a task literal exceeds its union complexity limit (TS2590), so
 * the one signature we need is declared here instead.
 */
const createBackgroundRemover = pipeline as unknown as (
	task: "background-removal",
	model: string,
	options: {
		device: InferenceBackend["device"];
		dtype: InferenceBackend["dtype"];
		progress_callback: (event: ModelLoadProgress) => void;
		session_options?: {
			enableCpuMemArena?: boolean;
			enableMemPattern?: boolean;
		};
	},
) => Promise<BackgroundRemover>;

/**
 * Trades a little CPU speed for a lower peak allocation. The arena allocator
 * reserves large blocks up front and memory patterning pre-allocates from predicted
 * shapes; at BiRefNet's resolution that overhead is what tips the WASM heap into
 * `std::bad_alloc`. Both flags are supported on the WebAssembly backend.
 * @see https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html
 */
const MEMORY_LEAN_SESSION = {
	enableCpuMemArena: false,
	enableMemPattern: false,
};

const downloads = new Map<string, FileDownload>();

let remover: BackgroundRemover | null = null;
let backendQueue: InferenceBackend[] | null = null;

function reportDownloadProgress(event: ModelLoadProgress): void {
	if (event.status !== "progress" || !event.file) return;

	downloads.set(event.file, {
		loaded: event.loaded ?? 0,
		total: event.total ?? 0,
	});

	self.postMessage({
		status: "downloading",
		...aggregateProgress(downloads.values()),
	});
}

/**
 * Hands ONNX Runtime a device with a widened storage-buffer limit. Must run before
 * the first session is created, which is why it sits ahead of the pipeline call.
 * @see https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
 */
async function configureWebGpuDevice(): Promise<void> {
	const { device, detail } = await createWebGpuDevice();
	const webgpu = env.backends.onnx?.webgpu;

	if (!device) {
		console.warn(`[background-removal] webgpu device not raised: ${detail}`);
		return;
	}

	if (!webgpu) {
		console.warn(
			"[background-removal] ONNX Runtime webgpu env unavailable; default limits will apply",
		);
		return;
	}

	webgpu.device = device;
	console.log(`[background-removal] ${detail}`);
}

async function loadRemover(
	backend: InferenceBackend,
): Promise<BackgroundRemover> {
	if (remover) return remover;

	if (backend.device === "webgpu") {
		await configureWebGpuDevice();
	}

	self.postMessage({ status: "loading", message: "Loading AI model..." });

	remover = await createBackgroundRemover(
		"background-removal",
		BACKGROUND_REMOVAL_MODEL_ID,
		{
			device: backend.device,
			dtype: backend.dtype,
			progress_callback: reportDownloadProgress,
			...(backend.device === "wasm"
				? { session_options: MEMORY_LEAN_SESSION }
				: {}),
		},
	);

	return remover;
}

/**
 * Releases device buffers before the next attempt. Exhausted GPU memory is one of
 * the failures this retry exists to recover from, so holding the old session open
 * would make the fallback fail for the same reason.
 *
 * State is cleared before releasing so a rejected release still leaves the next
 * attempt with a clean slate.
 */
async function disposeRemover(): Promise<void> {
	const previous = remover;
	remover = null;
	downloads.clear();

	await previous?.dispose();
}

async function toTransparentPng(
	segmenter: BackgroundRemover,
	imageData: Blob | string,
): Promise<Blob> {
	self.postMessage({
		status: "processing",
		message: "Removing background...",
	});

	// The pipeline scales the predicted mask back up to the dimensions of whatever it
	// was given and applies it as the alpha channel. The caller has already capped
	// those dimensions, so the output matches the working image, not the source file.
	const image = firstResult(await segmenter(imageData));

	return await image.toBlob("image/png");
}

async function selectedBackends(): Promise<InferenceBackend[]> {
	if (backendQueue) return backendQueue;

	const capabilities = await detectGpuCapabilities();
	backendQueue = selectBackends(capabilities);

	const plan = backendQueue.map((b) => `${b.device}/${b.dtype}`).join(" then ");
	console.log(
		`[background-removal] webgpu=${capabilities.hasWebGpu} shader-f16=${capabilities.hasShaderF16} maxStorageBuffers=${capabilities.maxStorageBuffersPerShaderStage} (need ${REQUIRED_STORAGE_BUFFERS_PER_STAGE}) -> ${plan}`,
	);

	return backendQueue;
}

async function removeBackground(
	imageData: Blob | string,
): Promise<RemovalResult> {
	const queue = await selectedBackends();

	try {
		const { result, backend } = await runWithFallback(
			queue,
			async (candidate) => {
				const loadStart = performance.now();
				const segmenter = await loadRemover(candidate);
				const loadMs = performance.now() - loadStart;

				const inferStart = performance.now();
				const blob = await toTransparentPng(segmenter, imageData);

				return { blob, loadMs, inferMs: performance.now() - inferStart };
			},
			disposeRemover,
		);

		return { ...result, backend };
	} catch (error) {
		if (error instanceof BackendExhaustedError) {
			console.error("All inference backends failed:", error.failures);
		}
		throw error;
	}
}

self.onmessage = async (
	event: MessageEvent<{ action?: string; imageData?: Blob | string }>,
) => {
	const { action, imageData } = event.data;
	if (action !== "process" || !imageData) return;

	try {
		const { blob, backend, loadMs, inferMs } =
			await removeBackground(imageData);

		console.log(
			`[background-removal] ${backend.device}/${backend.dtype} load=${Math.round(loadMs)}ms infer=${Math.round(inferMs)}ms`,
		);

		self.postMessage({
			status: "complete",
			processedImageUrl: URL.createObjectURL(blob),
			meta: { ...backend, loadMs, inferMs },
		});
	} catch (error) {
		console.error("Worker error:", error);
		self.postMessage({ status: "error", message: describeError(error) });
	}
};
