import { expect, test } from "bun:test";
import { toInMemoryBlob } from "../lib/prepare-image";

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

test("copies the file's bytes", async () => {
	const file = new File([PNG_SIGNATURE], "photo.png", { type: "image/png" });

	const copy = await toInMemoryBlob(file);

	expect(new Uint8Array(await copy.arrayBuffer())).toEqual(PNG_SIGNATURE);
});

test("keeps the MIME type the decoder relies on", async () => {
	const file = new File([PNG_SIGNATURE], "photo.png", { type: "image/png" });

	expect((await toInMemoryBlob(file)).type).toBe("image/png");
});

test("returns a new blob rather than the picked file", async () => {
	const file = new File([PNG_SIGNATURE], "photo.png", { type: "image/png" });

	const copy = await toInMemoryBlob(file);

	expect(copy).not.toBe(file);
	expect(copy).not.toBeInstanceOf(File);
});

test("surfaces a file that cannot be read", async () => {
	const unreadable = {
		type: "image/png",
		arrayBuffer: () =>
			Promise.reject(new DOMException("could not be read", "NotReadableError")),
	} as unknown as Blob;

	await expect(toInMemoryBlob(unreadable)).rejects.toThrow("could not be read");
});
