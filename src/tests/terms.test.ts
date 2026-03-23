import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("Terms of Service content contains required clauses", () => {
	const filePath = join(process.cwd(), "src/pages/terms.astro");
	const content = readFileSync(filePath, "utf-8");

	// Check for "free product"
	expect(content).toContain("deBackground is a <strong>free product</strong>");

	// Check for liability clause
	expect(content).toContain("Limitation of Liability");
	expect(content).toContain("I (the developer) am not liable for any damages");

	// Check for donations & refunds
	expect(content).toContain("Donations & Refunds");
	expect(content).toContain("refunds cannot be guaranteed");
	expect(content).toContain("voluntary");
});
