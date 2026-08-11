import { fitWithin } from "./image-size";

/**
 * JPEG cannot carry an alpha channel, so a JPEG source loses nothing by staying
 * JPEG and re-encodes far smaller. Anything else keeps PNG so transparency in the
 * original survives the downscale.
 */
function encodingFor(file: File): string {
	return file.type === "image/jpeg" ? "image/jpeg" : "image/png";
}

const JPEG_QUALITY = 0.92;

/**
 * Returns the image to hand to the model and to display, downscaled to fit
 * `MAX_WORKING_EDGE` if needed.
 *
 * The decoded bitmap is closed as soon as it has been drawn: it holds the only
 * full-resolution buffer in the process, and on a phone that buffer plus the
 * pipeline's own copies is what exhausts the renderer.
 *
 * Falls back to the original file whenever downscaling is unnecessary or fails,
 * so a missing 2D context degrades to today's behaviour instead of erroring.
 */
export async function toWorkingImage(file: File): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const target = fitWithin({ width: bitmap.width, height: bitmap.height });

	if (target.width === bitmap.width && target.height === bitmap.height) {
		bitmap.close();
		return file;
	}

	const canvas = document.createElement("canvas");
	canvas.width = target.width;
	canvas.height = target.height;

	const context = canvas.getContext("2d");
	if (!context) {
		bitmap.close();
		return file;
	}

	context.drawImage(bitmap, 0, 0, target.width, target.height);
	bitmap.close();

	const encoded = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, encodingFor(file), JPEG_QUALITY);
	});

	return encoded ?? file;
}
