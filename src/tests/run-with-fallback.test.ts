import { expect, test } from "bun:test";
import {
	BackendExhaustedError,
	runWithFallback,
} from "../workers/run-with-fallback";
import type { InferenceBackend } from "../workers/select-backend";

const GPU: InferenceBackend = { model: "m", device: "webgpu", dtype: "fp16" };
const CPU: InferenceBackend = { model: "m", device: "wasm", dtype: "fp32" };

const noop = async () => {};

function failOnce(failing: InferenceBackend["device"]) {
	return async (backend: InferenceBackend) => {
		if (backend.device === failing)
			throw new Error("shader compilation failed");
		return "mask";
	};
}

test("returns the first backend that succeeds", async () => {
	const run = await runWithFallback([GPU, CPU], async () => "mask", noop);

	expect(run.backend).toEqual(GPU);
});

test("does not clean up when the first attempt succeeds", async () => {
	let cleanups = 0;

	await runWithFallback(
		[GPU, CPU],
		async () => "mask",
		async () => {
			cleanups += 1;
		},
	);

	expect(cleanups).toBe(0);
});

test("falls through to the next backend when one fails", async () => {
	const run = await runWithFallback([GPU, CPU], failOnce("webgpu"), noop);

	expect(run.backend).toEqual(CPU);
});

test("still falls through when cleanup itself throws", async () => {
	const run = await runWithFallback(
		[GPU, CPU],
		failOnce("webgpu"),
		async () => {
			throw new Error("failed to release session");
		},
	);

	expect(run.backend).toEqual(CPU);
});

test("drops the failed backend so later calls skip it", async () => {
	const queue = [GPU, CPU];

	await runWithFallback(queue, failOnce("webgpu"), noop);

	expect(queue).toEqual([CPU]);
});

test("throws BackendExhaustedError once every backend fails", async () => {
	const attempt = async () => {
		throw new Error("nope");
	};

	expect(runWithFallback([GPU, CPU], attempt, noop)).rejects.toThrow(
		BackendExhaustedError,
	);
});

test("reports every backend failure for diagnostics", async () => {
	const attempt = async () => {
		throw new Error("nope");
	};

	try {
		await runWithFallback([GPU, CPU], attempt, noop);
		throw new Error("expected BackendExhaustedError");
	} catch (error) {
		expect((error as BackendExhaustedError).failures).toEqual([
			"m webgpu/fp16: nope",
			"m wasm/fp32: nope",
		]);
	}
});

test("reports a cleanup failure alongside the attempt failure", async () => {
	const attempt = async () => {
		throw new Error("nope");
	};

	try {
		await runWithFallback([GPU], attempt, async () => {
			throw new Error("release rejected");
		});
		throw new Error("expected BackendExhaustedError");
	} catch (error) {
		expect((error as BackendExhaustedError).failures).toContain(
			"cleanup after m webgpu/fp16: release rejected",
		);
	}
});

test("throws immediately when there are no backends to try", async () => {
	expect(runWithFallback([], async () => "mask", noop)).rejects.toThrow(
		BackendExhaustedError,
	);
});
