import { expect, test } from "bun:test";
import { aggregateProgress } from "../workers/download-progress";

test("reports zero for no files", () => {
	expect(aggregateProgress([])).toEqual({ percent: 0, loaded: 0, total: 0 });
});

test("computes the percentage of a single file", () => {
	const progress = aggregateProgress([{ loaded: 50, total: 200 }]);

	expect(progress.percent).toBe(25);
});

test("sums bytes across files", () => {
	const progress = aggregateProgress([
		{ loaded: 100, total: 400 },
		{ loaded: 100, total: 100 },
	]);

	expect(progress).toEqual({ percent: 40, loaded: 200, total: 500 });
});

test("reports zero rather than dividing by a zero total", () => {
	const progress = aggregateProgress([{ loaded: 0, total: 0 }]);

	expect(progress.percent).toBe(0);
});

test("clamps to 100 when reported bytes exceed the total", () => {
	const progress = aggregateProgress([{ loaded: 500, total: 400 }]);

	expect(progress.percent).toBe(100);
});

test("reaches 100 on a completed download", () => {
	const progress = aggregateProgress([{ loaded: 400, total: 400 }]);

	expect(progress.percent).toBe(100);
});
