import { expect, test } from "bun:test";
import {
	BACKGROUND_REMOVAL_MODEL_ID,
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
} from "../lib/constants";
import {
	canTryEnhancedModel,
	type DeviceProfile,
	ENHANCED_MODEL_MIN_DEVICE_MEMORY_GB,
	type InferenceBackend,
	REQUIRED_STORAGE_BUFFERS_PER_STAGE,
	selectBackends,
} from "../workers/select-backend";

const CPU: InferenceBackend = {
	model: BACKGROUND_REMOVAL_MODEL_ID,
	device: "wasm",
	dtype: "fp32",
};

const ENHANCED: InferenceBackend = {
	model: ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
	device: "webgpu",
	dtype: "fp16",
};

function profile(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
	return {
		hasWebGpu: true,
		hasShaderF16: true,
		maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE,
		deviceMemoryGb: ENHANCED_MODEL_MIN_DEVICE_MEMORY_GB,
		enhancedModelFailed: false,
		isMobile: false,
		...overrides,
	};
}

/** The BiRefNet_lite part of the queue, which these tests predate. */
function fallbacks(overrides: Partial<DeviceProfile> = {}) {
	return selectBackends(profile({ enhancedModelFailed: true, ...overrides }));
}

test("prefers WebGPU fp16 when the adapter supports shader-f16", () => {
	expect(fallbacks()[0]).toEqual({
		model: BACKGROUND_REMOVAL_MODEL_ID,
		device: "webgpu",
		dtype: "fp16",
	});
});

test("drops to fp32 on a WebGPU adapter without shader-f16", () => {
	expect(fallbacks({ hasShaderF16: false })[0]).toEqual({
		model: BACKGROUND_REMOVAL_MODEL_ID,
		device: "webgpu",
		dtype: "fp32",
	});
});

test("offers only the CPU backend when WebGPU is unavailable", () => {
	const backends = selectBackends(
		profile({ hasWebGpu: false, maxStorageBuffersPerShaderStage: 0 }),
	);

	expect(backends).toEqual([CPU]);
});

test("skips WebGPU when the adapter caps below the shader's needs", () => {
	const backends = fallbacks({
		maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE - 1,
	});

	expect(backends).toEqual([CPU]);
});

test("uses WebGPU when the adapter exceeds the shader's needs", () => {
	const backends = fallbacks({
		maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE + 10,
	});

	expect(backends[0].device).toBe("webgpu");
});

test("tries the enhanced model first on a capable device", () => {
	const backends = selectBackends(profile());

	expect(backends[0]).toEqual(ENHANCED);
	expect(backends.slice(1)).toEqual(fallbacks());
});

test("keeps the enhanced model when the adapter is too small for BiRefNet", () => {
	const backends = selectBackends(
		profile({
			maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE - 1,
		}),
	);

	expect(backends).toEqual([ENHANCED, CPU]);
});

test("skips the enhanced model without WebGPU", () => {
	expect(canTryEnhancedModel(profile({ hasWebGpu: false }))).toBe(false);
});

test("skips the enhanced model without shader-f16, as it ships only fp16", () => {
	expect(canTryEnhancedModel(profile({ hasShaderF16: false }))).toBe(false);
});

test("skips the enhanced model below the memory floor", () => {
	const deviceMemoryGb = ENHANCED_MODEL_MIN_DEVICE_MEMORY_GB / 2;

	expect(canTryEnhancedModel(profile({ deviceMemoryGb }))).toBe(false);
});

test("tries the enhanced model where the browser hides device memory", () => {
	expect(canTryEnhancedModel(profile({ deviceMemoryGb: undefined }))).toBe(
		true,
	);
});

test("never tries the enhanced model on a phone or tablet", () => {
	expect(canTryEnhancedModel(profile({ isMobile: true }))).toBe(false);
});

test("a phone or tablet runs on the CPU only", () => {
	expect(selectBackends(profile({ isMobile: true }))).toEqual([CPU]);
});

test("skips the enhanced model once it has failed on this device", () => {
	expect(canTryEnhancedModel(profile({ enhancedModelFailed: true }))).toBe(
		false,
	);
});

test("always ends on the CPU fallback", () => {
	const variants = [
		profile(),
		profile({ hasShaderF16: false }),
		profile({ hasWebGpu: false }),
		profile({ maxStorageBuffersPerShaderStage: 10 }),
		profile({ enhancedModelFailed: true }),
	];

	for (const variant of variants) {
		expect(selectBackends(variant).at(-1)).toEqual(CPU);
	}
});

test("never pairs fp16 with WASM, which has no fp16 build", () => {
	const variants = [
		profile(),
		profile({ hasShaderF16: false }),
		profile({ hasWebGpu: false }),
		profile({ maxStorageBuffersPerShaderStage: 10 }),
	];

	for (const variant of variants) {
		const wasmDtypes = selectBackends(variant)
			.filter((backend) => backend.device === "wasm")
			.map((backend) => backend.dtype);

		expect(wasmDtypes).not.toContain("fp16");
	}
});
