import {
	BACKGROUND_REMOVAL_MODEL_ID,
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
} from "../lib/constants";

export type InferenceDevice = "webgpu" | "wasm";
export type InferenceDtype = "fp16" | "fp32";

export interface InferenceBackend {
	model: string;
	device: InferenceDevice;
	dtype: InferenceDtype;
}

export interface GpuCapabilities {
	hasWebGpu: boolean;
	hasShaderF16: boolean;
	maxStorageBuffersPerShaderStage: number;
}

export interface DeviceProfile extends GpuCapabilities {
	/** `navigator.deviceMemory`; undefined where the browser hides it (Safari, Firefox). */
	deviceMemoryGb: number | undefined;
	/** The enhanced model failed or crashed the tab on this device before. */
	enhancedModelFailed: boolean;
	/** Phone or tablet, per `isMobileDevice` on the page. */
	isMobile: boolean;
}

const CPU_FALLBACK: InferenceBackend = {
	model: BACKGROUND_REMOVAL_MODEL_ID,
	device: "wasm",
	dtype: "fp32",
};

const ENHANCED_BACKEND: InferenceBackend = {
	model: ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
	device: "webgpu",
	dtype: "fp16",
};

/**
 * Below this the enhanced model is not attempted. A guess pending real-device
 * numbers: BEN2 peaked at 3.4 GB on the CPU, and a phone's GPU shares that RAM.
 * Chromium reports at most 8, so this admits 8 GB phones and every desktop.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */
export const ENHANCED_MODEL_MIN_DEVICE_MEMORY_GB = 8;

/**
 * BiRefNet's heaviest shader binds 11 storage buffers. ONNX Runtime's WebGPU
 * provider aborts with "Too many storage buffers in shader. Current: 11" on
 * adapters that cap below this, and no amount of raising `requiredLimits` helps
 * once the adapter itself is the ceiling.
 *
 * Detecting it up front matters twice over: it avoids downloading 114 MB of fp16
 * weights for a run that cannot succeed, and it leaves ONNX Runtime's WebGPU
 * provider uninitialised so the CPU fallback starts from a clean state.
 */
export const REQUIRED_STORAGE_BUFFERS_PER_STAGE = 11;

/**
 * BiRefNet_lite backends to attempt in order, fastest first.
 *
 * fp16 is only ever paired with WebGPU. The model repo publishes no quantized
 * build, so WASM has to run fp32, and Transformers.js throws outright when fp16
 * is requested on an adapter lacking the `shader-f16` feature. Choosing the
 * dtype up front avoids downloading the 114 MB fp16 weights only to discover
 * the adapter cannot use them.
 */
function selectFallbackBackends(
	capabilities: GpuCapabilities,
): InferenceBackend[] {
	const canRunShader =
		capabilities.maxStorageBuffersPerShaderStage >=
		REQUIRED_STORAGE_BUFFERS_PER_STAGE;

	if (!capabilities.hasWebGpu || !canRunShader) {
		return [CPU_FALLBACK];
	}

	return [
		{
			model: BACKGROUND_REMOVAL_MODEL_ID,
			device: "webgpu",
			dtype: capabilities.hasShaderF16 ? "fp16" : "fp32",
		},
		CPU_FALLBACK,
	];
}

/**
 * Whether the enhanced model is worth its 219 MB download on this device.
 *
 * Never on mobile: BEN2 crashed an 8 GB Galaxy S22+ tab mid-inference, twice.
 *
 * There is no storage-buffer check: BEN2's per-shader count could not be measured
 * outside a browser, so an adapter that falls short fails at runtime instead, and
 * `enhancedModelFailed` keeps that device off it afterwards. The same flag catches
 * Safari killing the tab for memory, which `deviceMemory` cannot predict there.
 */
export function canTryEnhancedModel(profile: DeviceProfile): boolean {
	if (profile.isMobile) return false;
	if (!profile.hasWebGpu || !profile.hasShaderF16) return false;
	if (profile.enhancedModelFailed) return false;

	return (
		profile.deviceMemoryGb === undefined ||
		profile.deviceMemoryGb >= ENHANCED_MODEL_MIN_DEVICE_MEMORY_GB
	);
}

export function selectBackends(profile: DeviceProfile): InferenceBackend[] {
	const fallbacks = selectFallbackBackends(profile);

	return canTryEnhancedModel(profile)
		? [ENHANCED_BACKEND, ...fallbacks]
		: fallbacks;
}

export interface WebGpuDeviceResult {
	device: GPUDevice | null;
	/** Always populated, so a null device is never silent. */
	detail: string;
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Builds a device that asks for the adapter's own maximum storage-buffer limit.
 *
 * Omitting `requiredLimits` yields WebGPU's *default* limits rather than what the
 * adapter can actually do, and BiRefNet compiles a shader needing more storage
 * buffers per stage than that default allows. Requesting exactly the value the
 * adapter reports can never exceed it, so this widens the limit as far as the
 * hardware permits without risking an OperationError.
 *
 * Every failure path reports a reason: a silently null device is indistinguishable
 * from a device whose limits were never raised, which makes the WebGPU path
 * impossible to diagnose from a bug report.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapter/requestDevice
 */
export async function createWebGpuDevice(
	gpu: GPU | undefined = typeof navigator === "undefined"
		? undefined
		: navigator.gpu,
): Promise<WebGpuDeviceResult> {
	if (!gpu) {
		return { device: null, detail: "navigator.gpu is unavailable" };
	}

	let adapter: GPUAdapter | null;
	try {
		adapter = await gpu.requestAdapter();
	} catch (error) {
		return { device: null, detail: `requestAdapter threw: ${describe(error)}` };
	}

	if (!adapter) {
		return { device: null, detail: "no GPU adapter available" };
	}

	const supported = adapter.limits.maxStorageBuffersPerShaderStage;
	if (typeof supported !== "number") {
		return {
			device: null,
			detail: "adapter does not report maxStorageBuffersPerShaderStage",
		};
	}

	try {
		const device = await adapter.requestDevice({
			requiredLimits: { maxStorageBuffersPerShaderStage: supported },
		});

		return {
			device,
			detail: `maxStorageBuffersPerShaderStage adapter=${supported} granted=${device.limits.maxStorageBuffersPerShaderStage}`,
		};
	} catch (error) {
		return {
			device: null,
			detail: `requestDevice(maxStorageBuffersPerShaderStage=${supported}) threw: ${describe(error)}`,
		};
	}
}

/**
 * Probes the GPU once. Any failure is reported as "no WebGPU" so the caller
 * falls through to the CPU backend rather than surfacing an error.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter
 */
export async function detectGpuCapabilities(
	gpu: GPU | undefined = typeof navigator === "undefined"
		? undefined
		: navigator.gpu,
): Promise<GpuCapabilities> {
	const unsupported: GpuCapabilities = {
		hasWebGpu: false,
		hasShaderF16: false,
		maxStorageBuffersPerShaderStage: 0,
	};

	if (!gpu) {
		return unsupported;
	}

	try {
		const adapter = await gpu.requestAdapter();
		if (!adapter) {
			return unsupported;
		}

		return {
			hasWebGpu: true,
			hasShaderF16: adapter.features.has("shader-f16"),
			maxStorageBuffersPerShaderStage:
				adapter.limits.maxStorageBuffersPerShaderStage ?? 0,
		};
	} catch (_error) {
		return unsupported;
	}
}
