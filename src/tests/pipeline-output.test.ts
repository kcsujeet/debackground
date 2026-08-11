import { expect, test } from "bun:test";
import { firstResult } from "../workers/pipeline-output";

test("returns a bare result unchanged", () => {
	const image = { width: 8 };

	expect(firstResult(image)).toBe(image);
});

test("unwraps the first item of a batch", () => {
	const first = { width: 8 };

	expect(firstResult([first, { width: 16 }])).toBe(first);
});

test("throws a clear error for an empty batch", () => {
	expect(() => firstResult([])).toThrow(
		"The background removal pipeline returned no image.",
	);
});

test("preserves a falsy bare result", () => {
	expect(firstResult(0)).toBe(0);
});
