import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	BACKGROUND_REMOVAL_MODEL_ID,
	ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
} from "../lib/constants";

// The README and agent notes both previously named a model the worker did not
// load. These guard against that drift returning.

function readProjectFile(name: string) {
	return readFileSync(join(process.cwd(), name), "utf-8");
}

test("README documents the model the worker actually loads", () => {
	expect(readProjectFile("README.md")).toContain(BACKGROUND_REMOVAL_MODEL_ID);
});

test("agent notes document the model the worker actually loads", () => {
	expect(readProjectFile("GEMINI.md")).toContain(BACKGROUND_REMOVAL_MODEL_ID);
});

test("README documents the enhanced model the worker tries first", () => {
	expect(readProjectFile("README.md")).toContain(
		ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
	);
});

test("agent notes document the enhanced model the worker tries first", () => {
	expect(readProjectFile("GEMINI.md")).toContain(
		ENHANCED_BACKGROUND_REMOVAL_MODEL_ID,
	);
});
