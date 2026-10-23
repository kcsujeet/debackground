import { expect, test } from "bun:test";
import {
	BACKGROUND_REMOVAL_MODEL_ID,
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
} from "../lib/constants";
import {
	clearInterruptedAttempt,
	ENHANCED_MODEL_MARKER_KEY,
	hasEnhancedModelFailed,
	type MarkerStorage,
	recordModelAttempt,
	recordModelFailure,
	recordModelSuccess,
	settleCrashedAttempt,
} from "../lib/enhanced-model-memory";

const ENHANCED = ENHANCED_BACKGROUND_REMOVAL_MODEL_ID;
const FALLBACK = BACKGROUND_REMOVAL_MODEL_ID;

function memoryStorage(): MarkerStorage & { values: Map<string, string> } {
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

const throwingStorage: MarkerStorage = {
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

test("a fresh device has no failure on record", () => {
	expect(hasEnhancedModelFailed(memoryStorage())).toBe(false);
});

test("an attempt that never finished reads as a crash", () => {
	const storage = memoryStorage();

	recordModelAttempt(storage, ENHANCED);

	expect(hasEnhancedModelFailed(storage)).toBe(true);
});

test("a reported failure is remembered", () => {
	const storage = memoryStorage();

	recordModelAttempt(storage, ENHANCED);
	recordModelFailure(storage, ENHANCED);

	expect(hasEnhancedModelFailed(storage)).toBe(true);
});

test("a success clears the attempt marker", () => {
	const storage = memoryStorage();

	recordModelAttempt(storage, ENHANCED);
	recordModelSuccess(storage, ENHANCED);

	expect(hasEnhancedModelFailed(storage)).toBe(false);
});

test("the fallback model's outcomes leave the marker alone", () => {
	const storage = memoryStorage();

	recordModelAttempt(storage, FALLBACK);
	recordModelFailure(storage, FALLBACK);

	expect(storage.values.has(ENHANCED_MODEL_MARKER_KEY)).toBe(false);
});

test("a fallback success does not erase an enhanced failure", () => {
	const storage = memoryStorage();

	recordModelFailure(storage, ENHANCED);
	recordModelSuccess(storage, FALLBACK);

	expect(hasEnhancedModelFailed(storage)).toBe(true);
});

test("leaving the page mid-attempt is not mistaken for a crash", () => {
	const storage = memoryStorage();

	recordModelAttempt(storage, ENHANCED);
	clearInterruptedAttempt(storage);

	expect(hasEnhancedModelFailed(storage)).toBe(false);
});

test("leaving the page keeps a reported failure", () => {
	const storage = memoryStorage();

	recordModelFailure(storage, ENHANCED);
	clearInterruptedAttempt(storage);

	expect(hasEnhancedModelFailed(storage)).toBe(true);
});

test("throwing storage is treated as no history", () => {
	recordModelAttempt(throwingStorage, ENHANCED);
	clearInterruptedAttempt(throwingStorage);

	expect(hasEnhancedModelFailed(throwingStorage)).toBe(false);
});

test("missing storage is treated as no history", () => {
	recordModelFailure(null, ENHANCED);

	expect(hasEnhancedModelFailed(null)).toBe(false);
});

test("an attempt left over from a crash survives the next page's exit", () => {
	const storage = memoryStorage();
	recordModelAttempt(storage, ENHANCED);

	// The tab dies here. The next load settles the marker, then the user leaves.
	settleCrashedAttempt(storage);
	clearInterruptedAttempt(storage);

	expect(hasEnhancedModelFailed(storage)).toBe(true);
	expect(storage.values.get(ENHANCED_MODEL_MARKER_KEY)).toBe("failed");
});

test("settling leaves a fresh device untouched", () => {
	const storage = memoryStorage();

	settleCrashedAttempt(storage);

	expect(storage.values.has(ENHANCED_MODEL_MARKER_KEY)).toBe(false);
});

test("settling tolerates unusable storage", () => {
	expect(() => settleCrashedAttempt(throwingStorage)).not.toThrow();
	expect(() => settleCrashedAttempt(null)).not.toThrow();
});
