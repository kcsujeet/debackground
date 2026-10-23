import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The site moved from debackground.com, whose domain is no longer renewed, to
// Cloudflare Pages. robots.txt is static and cannot read the Astro config, so this
// keeps the two from drifting apart again.

function readProjectFile(name: string) {
	return readFileSync(join(process.cwd(), name), "utf-8");
}

function configuredSite(): string {
	const match = readProjectFile("astro.config.mjs").match(/site:\s*"([^"]+)"/);
	if (!match) throw new Error("astro.config.mjs has no site");

	return match[1];
}

test("the site is served from Cloudflare Pages", () => {
	expect(configuredSite()).toBe("https://debackground.pages.dev");
});

test("robots.txt points at the configured site's sitemap", () => {
	expect(readProjectFile("public/robots.txt")).toContain(
		`Sitemap: ${configuredSite()}/sitemap-index.xml`,
	);
});

test("nothing still links the retired domain", () => {
	for (const file of ["astro.config.mjs", "public/robots.txt", "README.md"]) {
		expect(readProjectFile(file)).not.toContain("debackground.com");
	}
});
