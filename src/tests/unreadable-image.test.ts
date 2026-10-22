import { expect, test } from "bun:test";
import {
	readInputImage,
	UNREADABLE_IMAGE_MESSAGE,
	UnreadableImageError,
} from "../lib/unreadable-image";

const decodeFailure = new DOMException(
	"The source image could not be decoded.",
	"InvalidStateError",
);

test("returns the decoded image", async () => {
	const image = await readInputImage("blob:x", async () => "pixels");

	expect(image).toBe("pixels");
});

test("reports a decode failure as an unreadable image", async () => {
	const read = readInputImage("blob:x", () => Promise.reject(decodeFailure));

	await expect(read).rejects.toBeInstanceOf(UnreadableImageError);
});

test("tells the user it is the file, not the device", async () => {
	const read = readInputImage("blob:x", () => Promise.reject(decodeFailure));

	await expect(read).rejects.toThrow(UNREADABLE_IMAGE_MESSAGE);
});

test("keeps the browser's own reason as the cause", async () => {
	try {
		await readInputImage("blob:x", () => Promise.reject(decodeFailure));
		throw new Error("expected a rejection");
	} catch (error) {
		expect((error as UnreadableImageError).cause).toBe(decodeFailure);
	}
});

test("wraps a synchronous throw from the reader too", async () => {
	const read = readInputImage("blob:x", () => {
		throw new TypeError("Unsupported input type: object");
	});

	await expect(read).rejects.toBeInstanceOf(UnreadableImageError);
});
