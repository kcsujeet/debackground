import { expect, test } from "bun:test";
import {
	type GpuCapabilities,
	type InferenceBackend,
	REQUIRED_STORAGE_BUFFERS_PER_STAGE,
	selectBackends,
} from "../workers/select-backend";

const CPU: InferenceBackend = { device: "wasm", dtype: "fp32" };

function capabilities(
	overrides: Partial<GpuCapabilities> = {},
): GpuCapabilities {
	return {
		hasWebGpu: true,
		hasShaderF16: true,
		maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE,
		...overrides,
	};
}

test("prefers WebGPU fp16 when the adapter supports shader-f16", () => {
	const backends = selectBackends(capabilities());

	expect(backends[0]).toEqual({ device: "webgpu", dtype: "fp16" });
});

test("drops to fp32 on a WebGPU adapter without shader-f16", () => {
	const backends = selectBackends(capabilities({ hasShaderF16: false }));

	expect(backends[0]).toEqual({ device: "webgpu", dtype: "fp32" });
});

test("offers only the CPU backend when WebGPU is unavailable", () => {
	const backends = selectBackends(
		capabilities({ hasWebGpu: false, maxStorageBuffersPerShaderStage: 0 }),
	);

	expect(backends).toEqual([CPU]);
});

test("skips WebGPU when the adapter caps below the shader's needs", () => {
	const backends = selectBackends(
		capabilities({
			maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE - 1,
		}),
	);

	expect(backends).toEqual([CPU]);
});

test("uses WebGPU when the adapter exceeds the shader's needs", () => {
	const backends = selectBackends(
		capabilities({
			maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS_PER_STAGE + 10,
		}),
	);

	expect(backends[0].device).toBe("webgpu");
});

test("ignores a stale shader-f16 flag when WebGPU is unavailable", () => {
	const backends = selectBackends(
		capabilities({ hasWebGpu: false, maxStorageBuffersPerShaderStage: 0 }),
	);

	expect(backends).toEqual([CPU]);
});

test("always ends on the CPU fallback", () => {
	const variants = [
		capabilities(),
		capabilities({ hasShaderF16: false }),
		capabilities({ hasWebGpu: false }),
		capabilities({ maxStorageBuffersPerShaderStage: 10 }),
	];

	for (const variant of variants) {
		expect(selectBackends(variant).at(-1)).toEqual(CPU);
	}
});

test("never pairs fp16 with WASM, which has no fp16 build", () => {
	const variants = [
		capabilities(),
		capabilities({ hasShaderF16: false }),
		capabilities({ hasWebGpu: false }),
		capabilities({ maxStorageBuffersPerShaderStage: 10 }),
	];

	for (const variant of variants) {
		const wasmDtypes = selectBackends(variant)
			.filter((backend) => backend.device === "wasm")
			.map((backend) => backend.dtype);

		expect(wasmDtypes).not.toContain("fp16");
	}
});
