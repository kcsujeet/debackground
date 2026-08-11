import { expect, test } from "bun:test";
import config from "../../astro.config.mjs";

// Transformers.js is imported only by the background-removal worker, so Vite's
// source crawl does not find it. Without an explicit entry it gets discovered when
// the worker first loads, and the resulting re-optimization invalidates the module
// URLs of any tab that is already open, leaving the React island unhydrated.

test("pre-bundles the worker-only Transformers.js dependency", () => {
	expect(config.vite?.optimizeDeps?.include).toContain(
		"@huggingface/transformers",
	);
});
