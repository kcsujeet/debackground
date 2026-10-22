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
 * Copies a picked file's bytes into memory.
 *
 * A `File` from the picker is a reference that is read lazily, and on Android it
 * can stop being readable after the first read: the page decoded a photo, then the
 * worker failed with "The source image could not be decoded" on the same File
 * seconds later. Reading it once, straight away, leaves nothing to go stale.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer
 */
export async function toInMemoryBlob(file: Blob): Promise<Blob> {
	return new Blob([await file.arrayBuffer()], { type: file.type });
}

/**
 * Returns the image to hand to the model and to display, downscaled to fit
 * `MAX_WORKING_EDGE` if needed.
 *
 * The decoded bitmap is closed as soon as it has been drawn: it holds the only
 * full-resolution buffer in the process, and on a phone that buffer plus the
 * pipeline's own copies is what exhausts the renderer.
 *
 * Falls back to the in-memory copy of the file whenever downscaling is
 * unnecessary or fails, so a missing 2D context degrades instead of erroring.
 * Never returns the `File` itself; see `toInMemoryBlob`.
 */
export async function toWorkingImage(file: File): Promise<Blob> {
	const source = await toInMemoryBlob(file);
	const bitmap = await createImageBitmap(source);
	const target = fitWithin({ width: bitmap.width, height: bitmap.height });

	console.log(
		`[prepare-image] source type="${file.type}" size=${file.size} ${bitmap.width}x${bitmap.height} -> ${target.width}x${target.height}`,
	);

	if (target.width === bitmap.width && target.height === bitmap.height) {
		bitmap.close();
		return source;
	}

	const canvas = document.createElement("canvas");
	canvas.width = target.width;
	canvas.height = target.height;

	const context = canvas.getContext("2d");
	if (!context) {
		bitmap.close();
		return source;
	}

	context.drawImage(bitmap, 0, 0, target.width, target.height);
	bitmap.close();

	const encoded = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, encodingFor(file), JPEG_QUALITY);
	});

	console.log(
		`[prepare-image] working type="${encoded?.type ?? "none"}" size=${encoded?.size ?? 0}`,
	);

	return encoded ?? source;
}
