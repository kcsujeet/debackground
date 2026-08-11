import { expect, test } from "bun:test";
import {
	createWebGpuDevice,
	detectGpuCapabilities,
} from "../workers/select-backend";

function fakeGpu(adapter: unknown): GPU {
	return { requestAdapter: async () => adapter } as unknown as GPU;
}

function fakeAdapter({
	limit,
	features = [],
	device,
	deviceError,
}: {
	limit: number | undefined;
	features?: string[];
	device?: unknown;
	deviceError?: Error;
}) {
	return {
		limits: { maxStorageBuffersPerShaderStage: limit },
		features: new Set(features),
		requestDevice: async () => {
			if (deviceError) throw deviceError;
			return device;
		},
	};
}

test("reports when WebGPU is entirely unavailable", async () => {
	const { detail } = await createWebGpuDevice(undefined);

	expect(detail).toBe("navigator.gpu is unavailable");
});

test("reports when no adapter is returned", async () => {
	const { device } = await createWebGpuDevice(fakeGpu(null));

	expect(device).toBeNull();
});

test("reports when the adapter omits the storage-buffer limit", async () => {
	const gpu = fakeGpu(fakeAdapter({ limit: undefined }));

	const { detail } = await createWebGpuDevice(gpu);

	expect(detail).toBe(
		"adapter does not report maxStorageBuffersPerShaderStage",
	);
});

test("surfaces the reason when requestDevice rejects", async () => {
	const gpu = fakeGpu(
		fakeAdapter({ limit: 16, deviceError: new Error("OperationError") }),
	);

	const { detail } = await createWebGpuDevice(gpu);

	expect(detail).toContain("OperationError");
});

test("requests the adapter's own maximum storage-buffer limit", async () => {
	let requested: number | undefined;
	const adapter = {
		limits: { maxStorageBuffersPerShaderStage: 16 },
		features: new Set<string>(),
		requestDevice: async (options: GPUDeviceDescriptor) => {
			requested = options.requiredLimits
				?.maxStorageBuffersPerShaderStage as number;
			return { limits: { maxStorageBuffersPerShaderStage: 16 } };
		},
	};

	await createWebGpuDevice(fakeGpu(adapter));

	expect(requested).toBe(16);
});

test("reports the granted limit on success", async () => {
	const gpu = fakeGpu(
		fakeAdapter({
			limit: 16,
			device: { limits: { maxStorageBuffersPerShaderStage: 16 } },
		}),
	);

	const { detail } = await createWebGpuDevice(gpu);

	expect(detail).toBe("maxStorageBuffersPerShaderStage adapter=16 granted=16");
});

test("detects the adapter's storage-buffer limit", async () => {
	const gpu = fakeGpu(fakeAdapter({ limit: 16, features: ["shader-f16"] }));

	const capabilities = await detectGpuCapabilities(gpu);

	expect(capabilities.maxStorageBuffersPerShaderStage).toBe(16);
});

test("treats a missing storage-buffer limit as zero", async () => {
	const gpu = fakeGpu(fakeAdapter({ limit: undefined }));

	const capabilities = await detectGpuCapabilities(gpu);

	expect(capabilities.maxStorageBuffersPerShaderStage).toBe(0);
});

test("reports no WebGPU when the adapter request throws", async () => {
	const gpu = {
		requestAdapter: async () => {
			throw new Error("boom");
		},
	} as unknown as GPU;

	const capabilities = await detectGpuCapabilities(gpu);

	expect(capabilities.hasWebGpu).toBe(false);
});
