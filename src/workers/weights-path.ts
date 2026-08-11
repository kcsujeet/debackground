import type { InferenceDtype } from "./select-backend";

/**
 * Path of the weights file Transformers.js will request for a given dtype.
 *
 * Mirrors the library's dtype suffix mapping, where fp32 has no suffix and fp16
 * appends `_fp16`. Used to ask the cache whether the large download has already
 * happened, which is the only dependable way to tell a cached load from a fresh
 * one: outside Firefox the progress events for the two are identical.
 * @see https://huggingface.co/docs/transformers.js/en/api/env
 */
export function weightsPath(dtype: InferenceDtype): string {
	const suffix = dtype === "fp16" ? "_fp16" : "";

	return `onnx/model${suffix}.onnx`;
}

/**
 * Whether `cachedUrls` already contains the weights for this model and dtype.
 *
 * Matches on both the model id and the exact weights filename so that weights left
 * behind by a previously used model, or by the other dtype, are not mistaken for
 * this one.
 */
export function isWeightsCached(
	cachedUrls: Iterable<string>,
	modelId: string,
	dtype: InferenceDtype,
): boolean {
	const expected = weightsPath(dtype);

	for (const url of cachedUrls) {
		if (url.includes(modelId) && url.endsWith(expected)) {
			return true;
		}
	}

	return false;
}
