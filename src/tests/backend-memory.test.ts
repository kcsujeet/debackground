import { expect, test } from "bun:test";
import {
	BACKEND_MEMORY_KEY,
	backendKey,
	clearInterruptedAttempts,
	describeBackendMemory,
	failedBackendKeys,
	forgetAllBackends,
	type MemoryStorage,
	recordAttempt,
	recordFailure,
	recordSuccess,
	settleCrashedAttempts,
} from "../lib/backend-memory";

const BEN2_GPU = backendKey({
	model: "onnx-community/BEN2-ONNX",
	device: "webgpu",
});
const LITE_GPU = backendKey({
	model: "studioludens/birefnet-lite-512",
	device: "webgpu",
});

function memoryStorage(): MemoryStorage & { values: Map<string, string> } {
	const values = new Map<string, string>();

	return {
		values,
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => {
			values.set(key, value);
		},
		removeItem: (key) => {
			values.delete(key);
		},
	};
}

const throwingStorage: MemoryStorage = {
	getItem: () => {
		throw new Error("SecurityError");
	},
	setItem: () => {
		throw new Error("QuotaExceededError");
	},
	removeItem: () => {
		throw new Error("SecurityError");
	},
};

test("the key names the model and device but not the dtype", () => {
	expect(LITE_GPU).toBe("studioludens/birefnet-lite-512 webgpu");
});

test("a fresh browser has no failed backends", () => {
	expect(failedBackendKeys(memoryStorage())).toEqual([]);
});

test("an attempt that never finished counts as failed", () => {
	const storage = memoryStorage();

	recordAttempt(storage, LITE_GPU);

	expect(failedBackendKeys(storage)).toEqual([LITE_GPU]);
});

test("a success forgets that backend's attempt", () => {
	const storage = memoryStorage();

	recordAttempt(storage, LITE_GPU);
	recordSuccess(storage, LITE_GPU);

	expect(failedBackendKeys(storage)).toEqual([]);
	expect(storage.values.has(BACKEND_MEMORY_KEY)).toBe(false);
});

test("backends are remembered independently", () => {
	const storage = memoryStorage();

	recordFailure(storage, BEN2_GPU);
	recordAttempt(storage, LITE_GPU);
	recordSuccess(storage, LITE_GPU);

	expect(failedBackendKeys(storage)).toEqual([BEN2_GPU]);
});

test("a GPU crash on any model survives the next page's exit", () => {
	const storage = memoryStorage();
	recordAttempt(storage, LITE_GPU);

	// The tab dies here. The next load settles the record, then the user leaves.
	settleCrashedAttempts(storage);
	clearInterruptedAttempts(storage);

	expect(failedBackendKeys(storage)).toEqual([LITE_GPU]);
	expect(describeBackendMemory(storage)).toBe(`${LITE_GPU}=failed`);
});

test("leaving mid-attempt is not mistaken for a crash", () => {
	const storage = memoryStorage();

	recordAttempt(storage, LITE_GPU);
	clearInterruptedAttempts(storage);

	expect(failedBackendKeys(storage)).toEqual([]);
});

test("leaving keeps failures that were already reported", () => {
	const storage = memoryStorage();

	recordFailure(storage, BEN2_GPU);
	recordAttempt(storage, LITE_GPU);
	clearInterruptedAttempts(storage);

	expect(failedBackendKeys(storage)).toEqual([BEN2_GPU]);
});

test("settling drops the legacy BEN2 marker", () => {
	const storage = memoryStorage();
	storage.setItem("debackground:enhanced-model", "failed");

	settleCrashedAttempts(storage);

	expect(storage.values.has("debackground:enhanced-model")).toBe(false);
	expect(failedBackendKeys(storage)).toEqual([]);
});

test("forgetting clears every record", () => {
	const storage = memoryStorage();
	recordFailure(storage, BEN2_GPU);
	recordFailure(storage, LITE_GPU);

	forgetAllBackends(storage);

	expect(failedBackendKeys(storage)).toEqual([]);
	expect(describeBackendMemory(storage)).toBe("none");
});

test("corrupt or foreign data is ignored", () => {
	const storage = memoryStorage();

	storage.setItem(BACKEND_MEMORY_KEY, "{not json");
	expect(failedBackendKeys(storage)).toEqual([]);

	storage.setItem(
		BACKEND_MEMORY_KEY,
		JSON.stringify({ [LITE_GPU]: "failed", other: "maybe" }),
	);
	expect(failedBackendKeys(storage)).toEqual([LITE_GPU]);
});

test("unusable storage is treated as no history", () => {
	expect(() => recordAttempt(throwingStorage, LITE_GPU)).not.toThrow();
	expect(() => settleCrashedAttempts(throwingStorage)).not.toThrow();
	expect(failedBackendKeys(throwingStorage)).toEqual([]);
	expect(failedBackendKeys(null)).toEqual([]);
});
