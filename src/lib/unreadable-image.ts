export const UNREADABLE_IMAGE_MESSAGE =
	"This image couldn't be read. Try another file, or save it again as a JPEG or PNG.";

/**
 * The input could not be read or decoded, as opposed to a model that could not
 * run. Kept apart so it is reported as a problem with the file rather than the
 * device, and so no model is tried against an image none of them can see. The
 * browser's own reason is kept as `cause` for the debug log.
 */
export class UnreadableImageError extends Error {
	constructor(cause: unknown) {
		super(UNREADABLE_IMAGE_MESSAGE, { cause });
		this.name = "UnreadableImageError";
	}
}

/**
 * Decodes `input` with `read`, turning any failure into `UnreadableImageError`.
 * The reader is passed in so this stays free of the Transformers.js import.
 */
export async function readInputImage<Input, Image>(
	input: Input,
	read: (input: Input) => Promise<Image>,
): Promise<Image> {
	try {
		return await read(input);
	} catch (error) {
		throw new UnreadableImageError(error);
	}
}
