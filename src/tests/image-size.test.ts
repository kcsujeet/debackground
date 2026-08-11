import { expect, test } from "bun:test";
import { fitWithin, MAX_WORKING_EDGE } from "../lib/image-size";

test("leaves an image that already fits untouched", () => {
	const source = { width: 800, height: 600 };

	expect(fitWithin(source)).toBe(source);
});

test("leaves an image sitting exactly on the cap untouched", () => {
	const source = { width: MAX_WORKING_EDGE, height: 1000 };

	expect(fitWithin(source)).toBe(source);
});

test("scales a landscape photo by its width", () => {
	const fitted = fitWithin({ width: 4032, height: 3024 }, 2048);

	expect(fitted).toEqual({ width: 2048, height: 1536 });
});

test("scales a portrait photo by its height", () => {
	const fitted = fitWithin({ width: 3024, height: 4032 }, 2048);

	expect(fitted).toEqual({ width: 1536, height: 2048 });
});

test("scales a square image on both edges", () => {
	const fitted = fitWithin({ width: 4000, height: 4000 }, 2048);

	expect(fitted).toEqual({ width: 2048, height: 2048 });
});

test("never rounds a thin edge down to zero", () => {
	const fitted = fitWithin({ width: 10000, height: 3 }, 2048);

	expect(fitted.height).toBe(1);
});

test("tolerates zero dimensions rather than dividing by zero", () => {
	const source = { width: 0, height: 0 };

	expect(fitWithin(source)).toBe(source);
});

test("caps an extreme panorama to the requested edge", () => {
	const fitted = fitWithin({ width: 20000, height: 1000 }, 2048);

	expect(fitted.width).toBe(2048);
});
