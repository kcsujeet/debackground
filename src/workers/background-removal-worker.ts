import { env, pipeline, type RawImage } from "@huggingface/transformers";
import {
	BACKGROUND_REMOVAL_MODEL_ID,
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
} from "../lib/constants";
import { formatConsoleArgs, mirrorConsole } from "../lib/debug-log";
import { formatMegabytes } from "../lib/utils";
import { aggregateProgress, type FileDownload } from "./download-progress";
import { firstResult } from "./pipeline-output";
import {
	BackendExhaustedError,
	describeError,
	runWithFallback,
} from "./run-with-fallback";
import {
	createWebGpuDevice,
	type DeviceProfile,
	detectGpuCapabilities,
	type InferenceBackend,
	REQUIRED_STORAGE_BUFFERS_PER_STAGE,
	selectBackends,
} from "./select-backend";
import { isWeightsCached } from "./weights-path";

// Transformers.js enables the Cache API whenever it is available and already handles
// the case where `caches.open` is blocked despite being visible, as happens in
// incognito and sandboxed iframes. Leaving the decision to it is deliberate: the
// override this replaces also demanded IndexedDB, which model caching never touches,
// and so silently disabled caching wherever IDB was unavailable.
if (!env.useBrowserCache) {
	console.warn(
		"Browser cache is not available. Models will be downloaded every session.",
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
/**
 * Whether the current load is actually fetching the weights over the network.
 *
 * Outside Firefox, Transformers.js streams cached files through the same
 * incremental progress callbacks as a download, so the events alone cannot tell the
 * two apart. Asking the cache up front can.
 */
let isFetchingWeights = false;
let backendQueue: InferenceBackend[] | null = null;
/** ONNX Runtime only takes a device before its first WebGPU session. */
let isWebGpuConfigured = false;

const MODEL_IDS = [
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
	BACKGROUND_REMOVAL_MODEL_ID,
];

/**
 * Reports whether the weights are actually persisting between sessions.
 *
 * Transformers.js stores them in the Cache API under `env.cacheKey`, and a failed
 * write is only a warning: the model silently re-downloads every visit. Logging the
 * entry count, matching keys and storage quota distinguishes a rejected write from a
 * key that never matches.
 */
async function reportCacheState(): Promise<void> {
	if (typeof caches === "undefined") {
		console.warn(
			"[background-removal] Cache API unavailable; weights will re-download every session",
		);
		return;
	}

	try {
		const cache = await caches.open(env.cacheKey);
		const keys = await cache.keys();
		const modelKeys = keys.filter((request) =>
			MODEL_IDS.some((model) => request.url.includes(model)),
		);
		const estimate = await navigator.storage?.estimate?.();

		console.log(
			`[background-removal] cache="${env.cacheKey}" useBrowserCache=${env.useBrowserCache} entries=${keys.length} forTheseModels=${modelKeys.length}` +
				(estimate
					? ` storage=${formatMegabytes(estimate.usage ?? 0)}/${formatMegabytes(estimate.quota ?? 0)}`
					: ""),
		);

		for (const request of modelKeys) {
			console.log(`[background-removal] cached: ${request.url}`);
		}
	} catch (error) {
		console.warn(
			`[background-removal] cache probe failed: ${describeError(error)}`,
		);
	}
}

function reportDownloadProgress(event: ModelLoadProgress): void {
	if (event.status !== "progress" || !event.file) return;

	downloads.set(event.file, {
		loaded: event.loaded ?? 0,
		total: event.total ?? 0,
	});

	if (!isFetchingWeights) return;

	self.postMessage({
		status: "downloading",
		...aggregateProgress(downloads.values()),
	});
}

/**
 * Hands ONNX Runtime a device with a widened storage-buffer limit. Must run before
 * the first session is created, which is why it sits ahead of the pipeline call,
 * and only once: with two WebGPU models queued, the second must not replace it.
 * @see https://onnxruntime.ai/docs/api/js/interfaces/Env.WebGpuFlags.html
 */
async function configureWebGpuDevice(): Promise<void> {
	if (isWebGpuConfigured) return;
	isWebGpuConfigured = true;

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

/**
 * Whether the weights for `dtype` still need fetching.
 *
 * Any uncertainty is reported as "already cached" so a probe failure produces a
 * missing progress bar rather than a bar that never advances.
 */
async function needsWeightsDownload(
	backend: InferenceBackend,
): Promise<boolean> {
	if (typeof caches === "undefined") return false;

	try {
		const cache = await caches.open(env.cacheKey);
		const keys = await cache.keys();

		return !isWeightsCached(
			keys.map((request) => request.url),
			backend.model,
			backend.dtype,
		);
	} catch (_error) {
		return false;
	}
}

async function loadRemover(
	backend: InferenceBackend,
): Promise<BackgroundRemover> {
	if (remover) return remover;

	if (backend.device === "webgpu") {
		await configureWebGpuDevice();
	}

	isFetchingWeights = await needsWeightsDownload(backend);

	// Deliberately not a distinct "loading the model" phase. Once the weights are
	// cached this step is invisible work on the way to a result, and announcing it
	// made every reload look like it was fetching the model again. A real download
	// still announces itself, because that one the user genuinely waits on.
	self.postMessage({ status: "processing", message: "Removing background..." });

	remover = await createBackgroundRemover("background-removal", backend.model, {
		device: backend.device,
		dtype: backend.dtype,
		progress_callback: reportDownloadProgress,
		...(backend.device === "wasm"
			? { session_options: MEMORY_LEAN_SESSION }
			: {}),
	});

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

async function selectedBackends(
	enhancedModelFailed: boolean,
): Promise<InferenceBackend[]> {
	if (backendQueue) return backendQueue;

	const profile: DeviceProfile = {
		...(await detectGpuCapabilities()),
		deviceMemoryGb: (navigator as { deviceMemory?: number }).deviceMemory,
		enhancedModelFailed,
	};
	backendQueue = selectBackends(profile);

	const plan = backendQueue
		.map((b) => `${b.model} ${b.device}/${b.dtype}`)
		.join(" then ");
	console.log(
		`[background-removal] webgpu=${profile.hasWebGpu} shader-f16=${profile.hasShaderF16} maxStorageBuffers=${profile.maxStorageBuffersPerShaderStage} (need ${REQUIRED_STORAGE_BUFFERS_PER_STAGE}) deviceMemory=${profile.deviceMemoryGb ?? "unknown"}GB enhancedModelFailed=${enhancedModelFailed} -> ${plan}`,
	);

	// Threading is the difference between one core and several on the CPU backend,
	// and it silently degrades to single-threaded without cross-origin isolation.
	console.log(
		`[background-removal] crossOriginIsolated=${globalThis.crossOriginIsolated} cores=${navigator.hardwareConcurrency} numThreads=${env.backends.onnx?.wasm?.numThreads ?? "auto"}`,
	);

	await reportCacheState();

	return backendQueue;
}

/**
 * Tells the page which model is about to run and whether it failed, so the page
 * can remember a device the enhanced model does not work on. Workers have no
 * `localStorage`, and a crash that kills the tab can only be seen from a marker
 * written before the attempt.
 */
async function reportedAttempt<T>(
	backend: InferenceBackend,
	attempt: () => Promise<T>,
): Promise<T> {
	self.postMessage({ status: "attempt", model: backend.model });

	try {
		return await attempt();
	} catch (error) {
		self.postMessage({ status: "attempt-failed", model: backend.model });
		throw error;
	}
}

async function removeBackground(
	imageData: Blob | string,
	enhancedModelFailed: boolean,
): Promise<RemovalResult> {
	const queue = await selectedBackends(enhancedModelFailed);

	try {
		const { result, backend } = await runWithFallback(
			queue,
			(candidate) =>
				reportedAttempt(candidate, async () => {
					const loadStart = performance.now();
					const segmenter = await loadRemover(candidate);
					const loadMs = performance.now() - loadStart;

					const inferStart = performance.now();
					const blob = await toTransparentPng(segmenter, imageData);

					return { blob, loadMs, inferMs: performance.now() - inferStart };
				}),
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

let isMirroringConsole = false;

/**
 * Sends every console line, and any error nothing caught, to the page for its
 * `?debug=1` panel. Off unless asked for, so normal sessions pay nothing.
 */
function startMirroringConsole(): void {
	if (isMirroringConsole) return;
	isMirroringConsole = true;

	mirrorConsole(console, (level, text) => {
		self.postMessage({ status: "log", level, text });
	});

	self.addEventListener("error", (event) => {
		self.postMessage({
			status: "log",
			level: "error",
			text: `Uncaught: ${formatConsoleArgs([event.error ?? event.message])}`,
		});
	});
	self.addEventListener("unhandledrejection", (event) => {
		self.postMessage({
			status: "log",
			level: "error",
			text: `Unhandled rejection: ${formatConsoleArgs([event.reason])}`,
		});
	});
}

self.onmessage = async (
	event: MessageEvent<{
		action?: string;
		imageData?: Blob | string;
		enhancedModelFailed?: boolean;
	}>,
) => {
	const { action, imageData, enhancedModelFailed = false } = event.data;
	if (action === "debug") {
		startMirroringConsole();
		return;
	}
	if (action !== "process" || !imageData) return;

	console.log(
		`[background-removal] input ${
			imageData instanceof Blob
				? `blob type="${imageData.type}" size=${imageData.size}`
				: `url ${imageData.slice(0, 40)}`
		}`,
	);

	try {
		const { blob, backend, loadMs, inferMs } = await removeBackground(
			imageData,
			enhancedModelFailed,
		);

		console.log(
			`[background-removal] ${backend.model} ${backend.device}/${backend.dtype} load=${Math.round(loadMs)}ms infer=${Math.round(inferMs)}ms`,
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
