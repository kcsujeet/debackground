import { useCallback, useEffect } from "react";
import { useEditorStore } from "./useEditorStore";

export function useImageProcessor() {
	const {
		image,
		sourceImage,
		flipX,
		flipY,
		manualMaskCanvas,
		maskUpdateCounter,
		isCleanupMode,
		setProcessedImageSource,
		setManualMaskCanvas,
	} = useEditorStore();

	useEffect(() => {
		let isMounted = true;

		const processImage = async () => {
			console.log(
				"[useImageProcessor] Processing image. Counter:",
				maskUpdateCounter,
			);

			// If no transforms and no mask, just use the original image prop
			// But if we are in cleanup mode, we need to proceed to initialize the mask canvas
			if (!flipX && !flipY && !manualMaskCanvas && !isCleanupMode) {
				console.log("[useImageProcessor] Using original image:", image);
				if (isMounted) setProcessedImageSource(image);
				return;
			}

			try {
				const img = new Image();
				// Don't use crossOrigin for local blobs to avoid potential CORS glitches
				if (!image.startsWith("blob:") && !image.startsWith("data:")) {
					img.crossOrigin = "anonymous";
				}
				img.src = image;

				await new Promise((resolve, reject) => {
					img.onload = resolve;
					img.onerror = () => reject(new Error("Failed to load main image"));
				});

				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				if (!manualMaskCanvas) {
					const maskCanvas = document.createElement("canvas");
					maskCanvas.width = img.width;
					maskCanvas.height = img.height;
					if (isMounted) setManualMaskCanvas(maskCanvas);
				}

				ctx.save();
				ctx.translate(flipX ? img.width : 0, flipY ? img.height : 0);
				ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
				ctx.drawImage(img, 0, 0);

				if (manualMaskCanvas) {
					const maskCtx = manualMaskCanvas.getContext("2d");
					if (maskCtx) {
						const maskData = maskCtx.getImageData(
							0,
							0,
							img.width,
							img.height,
						).data;
						const hasMask = maskData.some((v, i) => i % 4 === 3 && v > 0);

						if (hasMask) {
							const imageData = ctx.getImageData(0, 0, img.width, img.height);
							const data = imageData.data;

							if (sourceImage) {
								const sourceImg = new Image();
								if (
									!sourceImage.startsWith("blob:") &&
									!sourceImage.startsWith("data:")
								) {
									sourceImg.crossOrigin = "anonymous";
								}
								sourceImg.src = sourceImage;

								await new Promise((resolve, reject) => {
									sourceImg.onload = resolve;
									sourceImg.onerror = () =>
										reject(new Error("Failed to load source image"));
								});

								const sourceCanvas = document.createElement("canvas");
								sourceCanvas.width = img.width;
								sourceCanvas.height = img.height;
								const sourceCtx = sourceCanvas.getContext("2d");
								if (sourceCtx) {
									sourceCtx.drawImage(sourceImg, 0, 0);
									const sourceData = sourceCtx.getImageData(
										0,
										0,
										img.width,
										img.height,
									).data;

									for (let i = 0; i < data.length; i += 4) {
										const a = maskData[i + 3];
										if (a > 0) {
											if (maskData[i] > 128) {
												data[i + 3] = 0;
											} else if (maskData[i + 1] > 128) {
												data[i] = sourceData[i];
												data[i + 1] = sourceData[i + 1];
												data[i + 2] = sourceData[i + 2];
												data[i + 3] = sourceData[i + 3];
											}
										}
									}
									ctx.putImageData(imageData, 0, 0);
								}
							} else {
								// Fallback if no source image provided
								for (let i = 0; i < data.length; i += 4) {
									if (maskData[i + 3] > 0 && maskData[i] > 128) {
										data[i + 3] = 0;
									}
								}
								ctx.putImageData(imageData, 0, 0);
							}
						}
					}
				}

				ctx.restore();
				const dataUrl = canvas.toDataURL();
				console.log(
					"[useImageProcessor] Processed image to data URL, length:",
					dataUrl.length,
				);
				if (isMounted) setProcessedImageSource(dataUrl);
			} catch (err) {
				console.error("Editor processing error:", err);
				// Fallback to original image if processing fails
				if (isMounted) setProcessedImageSource(image);
			}
		};

		processImage();

		return () => {
			isMounted = false;
		};
	}, [
		image,
		flipX,
		flipY,
		manualMaskCanvas,
		maskUpdateCounter,
		sourceImage,
		isCleanupMode,
		setProcessedImageSource,
		setManualMaskCanvas,
	]);

	const createImage = useCallback(
		(url: string): Promise<HTMLImageElement> =>
			new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.crossOrigin = "anonymous";
				img.src = url;
			}),
		[],
	);

	return { createImage };
}
