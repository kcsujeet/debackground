// @ts-check

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
	site: "https://debackground.pages.dev",
	integrations: [react(), sitemap()],
	server: {
		host: true,
		port: 4324,
		// ONNX Runtime only enables multi-threaded WASM when `crossOriginIsolated` is
		// true, so without these the CPU backend runs single-threaded. Applies to
		// `astro dev` and `astro preview`; production is mirrored in `public/_headers`.
		// https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			// Transformers.js is reached only through the background-removal worker, so
			// Vite's source crawl misses it and re-optimizes once the worker first loads.
			// That re-optimization changes the dep hash mid-session, which 504s the module
			// URLs an already-open tab is holding and leaves the React island unhydrated.
			// https://vite.dev/guide/dep-pre-bundling
			include: ["@huggingface/transformers"],
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	},
});
