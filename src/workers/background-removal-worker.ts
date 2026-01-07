import { env, pipeline, RawImage } from "@huggingface/transformers";

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;

// biome-ignore lint/suspicious/noExplicitAny: Transformers.js segmenter type is complex
let segmenter: any = null; // Transformers.js segmenter

async function loadModels() {
	if (segmenter) return;

	self.postMessage({
		status: "loading",
		message: "Loading model...",
	});

	try {
		// Use modnet - Excellent for human segmentation (portraits)
		// MIT Licensed and stable in browsers
		const modelId = "Xenova/modnet";

		segmenter = await pipeline("image-segmentation", modelId, {
			device: "wasm", // Force stable CPU/WASM mode
		});

		console.log("Model loaded successfully");
		self.postMessage({ status: "ready", message: "Model ready" });
	} catch (error: unknown) {
		console.error("Model load error:", error);
		self.postMessage({
			status: "error",
			message: `Failed to load model: ${error instanceof Error ? error.message : String(error)}`,
		});
		throw error;
	}
}

self.onmessage = async (event) => {
	const { imageData, action } = event.data;

	if (action === "process") {
		try {
			await loadModels();

			self.postMessage({
				status: "processing",
				message: "Removing background...",
			});

			// Load image
			const image = await RawImage.fromURL(imageData);

			// Run segmentation
			const result = await segmenter(image);

			// ModNet returns the mask in result[0].mask
			const mask = result[0].mask;

			// Resize mask to match original image dimensions
			const resizedMask = await mask.resize(image.width, image.height);

			// Create final transparent image by merging alpha channel
			const rgba = new Uint8ClampedArray(image.width * image.height * 4);

			for (let i = 0; i < image.width * image.height; ++i) {
				rgba[i * 4] = image.data[i * 3]; // R
				rgba[i * 4 + 1] = image.data[i * 3 + 1]; // G
				rgba[i * 4 + 2] = image.data[i * 3 + 2]; // B
				rgba[i * 4 + 3] = resizedMask.data[i]; // A
			}

			const canvas = new OffscreenCanvas(image.width, image.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not get 2D context");

			const finalImageData = new ImageData(rgba, image.width, image.height);
			ctx.putImageData(finalImageData, 0, 0);

			const blob = await canvas.convertToBlob({ type: "image/png" });
			const processedImageUrl = URL.createObjectURL(blob);

			self.postMessage({
				status: "complete",
				processedImageUrl,
			});
		} catch (error: unknown) {
			console.error("Worker error:", error);
			self.postMessage({
				status: "error",
				message: `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
			});
		}
	}
};
