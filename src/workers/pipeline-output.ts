/**
 * Normalises a Transformers.js pipeline result to a single item.
 *
 * The background-removal pipeline returns a bare value for a single input but an
 * array for a batch (`return Array.isArray(images) ? result : result[0]`), and it
 * returned an array unconditionally before v4. Handling both shapes explicitly
 * states the assumption, where a bare destructure silently throws
 * "(intermediate value) is not iterable" the moment the shape changes.
 * @see https://huggingface.co/docs/transformers.js/en/api/pipelines
 */
export function firstResult<T>(output: T | T[]): T {
	if (!Array.isArray(output)) {
		return output;
	}

	const [first] = output;
	if (first === undefined) {
		throw new Error("The background removal pipeline returned no image.");
	}

	return first;
}
