/**
 * Longest edge, in pixels, that an image is processed at.
 *
 * The segmentation model runs at 512x512 and its mask is scaled back up, so pixels
 * beyond this cap sharpen the colour channels without adding any mask detail. They
 * do multiply memory: every stage of the pipeline holds another full-size buffer,
 * and a 12 MP phone photo pushes a mobile renderer past its budget and kills the tab.
 */
export const MAX_WORKING_EDGE = 2048;

export interface Dimensions {
	width: number;
	height: number;
}

/**
 * Scales dimensions down to fit within `maxEdge`, preserving aspect ratio.
 *
 * Returns the input untouched when it already fits, which lets callers skip
 * re-encoding small images entirely.
 */
export function fitWithin(
	source: Dimensions,
	maxEdge: number = MAX_WORKING_EDGE,
): Dimensions {
	const longestEdge = Math.max(source.width, source.height);

	if (longestEdge <= maxEdge || longestEdge <= 0) {
		return source;
	}

	const scale = maxEdge / longestEdge;

	return {
		width: Math.max(1, Math.round(source.width * scale)),
		height: Math.max(1, Math.round(source.height * scale)),
	};
}
