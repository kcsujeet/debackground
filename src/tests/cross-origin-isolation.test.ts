import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import config from "../../astro.config.mjs";

// ONNX Runtime only enables multi-threaded WASM under cross-origin isolation, so
// losing either header silently makes background removal several times slower with
// no error to notice. Dev and production are configured separately and both must hold.

const COOP = "same-origin";
const COEP = "require-corp";

// Astro's own `server.headers` is what `astro dev` and `astro preview` emit. The
// same keys under `vite.server.headers` are silently ignored, which is how this was
// first written and why the assertion targets the Astro option specifically.
function serverHeaders() {
	const server =
		typeof config.server === "function"
			? config.server({ command: "dev" })
			: config.server;

	return server?.headers ?? {};
}

test("the dev server sends Cross-Origin-Opener-Policy", () => {
	expect(serverHeaders()["Cross-Origin-Opener-Policy"]).toBe(COOP);
});

test("the dev server sends Cross-Origin-Embedder-Policy", () => {
	expect(serverHeaders()["Cross-Origin-Embedder-Policy"]).toBe(COEP);
});

test("the deployed headers file sets both isolation headers", () => {
	const headers = readFileSync(join(process.cwd(), "public/_headers"), "utf-8");

	expect(headers).toContain(`Cross-Origin-Opener-Policy: ${COOP}`);
	expect(headers).toContain(`Cross-Origin-Embedder-Policy: ${COEP}`);
});
