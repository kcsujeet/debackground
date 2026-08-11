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
	site: "https://debackground.com",
	integrations: [react(), sitemap()],
	server: {
		host: true,
		port: 4324,
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
