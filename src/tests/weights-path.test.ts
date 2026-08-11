import { expect, test } from "bun:test";
import { isWeightsCached, weightsPath } from "../workers/weights-path";

const MODEL = "studioludens/birefnet-lite-512";
const BASE = `https://huggingface.co/${MODEL}/resolve/main`;

// Taken verbatim from a real cache listing, so the matcher is pinned to the URL
// shape Transformers.js actually stores rather than an assumed one.
const CACHED = [
	`${BASE}/config.json`,
	`${BASE}/preprocessor_config.json`,
	`${BASE}/onnx/model.onnx`,
];

test("fp32 weights carry no dtype suffix", () => {
	expect(weightsPath("fp32")).toBe("onnx/model.onnx");
});

test("fp16 weights carry the _fp16 suffix", () => {
	expect(weightsPath("fp16")).toBe("onnx/model_fp16.onnx");
});

test("recognises real cached fp32 weights", () => {
	expect(isWeightsCached(CACHED, MODEL, "fp32")).toBe(true);
});

test("does not treat cached fp32 weights as fp16", () => {
	expect(isWeightsCached(CACHED, MODEL, "fp16")).toBe(false);
});

test("ignores config files when looking for weights", () => {
	const configsOnly = CACHED.slice(0, 2);

	expect(isWeightsCached(configsOnly, MODEL, "fp32")).toBe(false);
});

test("does not accept another model's weights", () => {
	const other = [
		"https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model.onnx",
	];

	expect(isWeightsCached(other, MODEL, "fp32")).toBe(false);
});

test("reports nothing cached for an empty cache", () => {
	expect(isWeightsCached([], MODEL, "fp32")).toBe(false);
});
