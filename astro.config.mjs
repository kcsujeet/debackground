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
	},
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	},
});
