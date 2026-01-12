import { useEffect, useState } from "react";
import CropperWorkspace from "./editor/CropperWorkspace";
import EditorSidebar from "./editor/EditorSidebar";
import EditorToolbar from "./editor/EditorToolbar";
import RefineOverlay from "./editor/RefineOverlay";
import { useEditorStore } from "./editor/useEditorStore";
import { useImageProcessor } from "./editor/useImageProcessor";

interface ImageEditorProps {
	image: string;
	sourceImage: string | null;
	onSave: (editedImageUrl: string, sourceImageUrl?: string) => void;
	onCancel: () => void;
}

export default function ImageEditor({
	image,
	sourceImage,
	onSave,
	onCancel,
}: ImageEditorProps): React.JSX.Element {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	// Initialize store with props
	const {
		initializeEditor,
		processedImageSource,
		sourceImage: originalImage,
		rotation,
		flipX,
		flipY,
		bgColor,
		bgImage,
		filters,
		croppedAreaPixels,
		isCleanupMode,
		setIsSpacePressed,
	} = useEditorStore();

	// Global key listeners for Spacebar
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				// Only prevent default if we're not in an input/textarea
				if (
					document.activeElement?.tagName === "INPUT" ||
					document.activeElement?.tagName === "TEXTAREA"
				)
					return;
				e.preventDefault();
				setIsSpacePressed(true);
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				setIsSpacePressed(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [setIsSpacePressed]);

	// Initialize editor state when component mounts or props change
	useEffect(() => {
		initializeEditor(image, sourceImage);
	}, [image, sourceImage, initializeEditor]);

	// Use image processor hook (handles all processing via store)
	const { createImage } = useImageProcessor();

	const processAndCrop = async (
		src: string,
		isOriginal = false,
	): Promise<string | undefined> => {
		try {
			const img = await createImage(src);
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Fallback to full image if no crop area is defined
			const area = croppedAreaPixels || {
				x: 0,
				y: 0,
				width: img.width,
				height: img.height,
			};

			canvas.width = area.width;
			canvas.height = area.height;

			// Background: either image or color - both receive filters
			if (!isOriginal) {
				// Apply filters to background
				ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`;

				if (bgImage) {
					// Draw background image with filters
					const bgImg = await createImage(bgImage);
					ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
				} else if (bgColor !== "transparent") {
					ctx.fillStyle = bgColor;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}

				ctx.filter = "none"; // Reset for subject
			}

			const maxSize = Math.max(img.width, img.height);
			const safeCanvas = document.createElement("canvas");
			safeCanvas.width = maxSize * 2;
			safeCanvas.height = maxSize * 2;
			const safeCtx = safeCanvas.getContext("2d");
			if (!safeCtx) return;

			safeCtx.translate(maxSize, maxSize);

			// Apply transformations
			// Note: processedImageSource already has flips, but sourceImage doesn't.
			// However, rotation is applied here for BOTH.
			if (isOriginal) {
				safeCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
			}

			safeCtx.rotate((rotation * Math.PI) / 180);
			safeCtx.drawImage(img, -img.width / 2, -img.height / 2);

			// Draw subject without filters (filters are on background)
			ctx.drawImage(
				safeCanvas,
				area.x + maxSize - img.width / 2,
				area.y + maxSize - img.height / 2,
				area.width,
				area.height,
				0,
				0,
				area.width,
				area.height,
			);

			return new Promise<string>((res) =>
				canvas.toBlob((b) => {
					if (b) res(URL.createObjectURL(b));
				}, "image/png"),
			);
		} catch (e) {
			console.error("Crop error:", e);
		}
	};

	const handleSave = async () => {
		const [resultUrl, sourceUrl] = await Promise.all([
			processAndCrop(processedImageSource),
			originalImage
				? processAndCrop(originalImage, true)
				: Promise.resolve(undefined),
		]);

		if (resultUrl) {
			onSave(resultUrl, sourceUrl);
		}
	};

	return (
		<div className="w-full h-full bg-background flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden">
			<div className="w-full h-full rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row relative">
				{/* Workspace */}
				<div className="flex-1 relative bg-muted overflow-hidden w-full h-full">
					{isCleanupMode ? <RefineOverlay /> : <CropperWorkspace />}

					{/* Header Overlays */}
					<EditorToolbar
						onExit={onCancel}
						onSave={handleSave}
						onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
					/>
				</div>

				{/* Mobile Backdrop Overlay */}
				{isSidebarOpen && (
					<button
						type="button"
						className="fixed inset-0 bg-black/60 z-50 md:hidden animate-in fade-in duration-300 w-full h-full border-none p-0 cursor-default"
						onClick={() => setIsSidebarOpen(false)}
						aria-label="Close sidebar"
					/>
				)}

				{/* Sidebar / Drawer */}
				<EditorSidebar
					isOpen={isSidebarOpen}
					onClose={() => setIsSidebarOpen(false)}
				/>
			</div>
		</div>
	);
}
