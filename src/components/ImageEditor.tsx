import { useEffect } from "react";

import CropperWorkspace from "./editor/CropperWorkspace";
import EditorSidebar from "./editor/EditorSidebar";
import EditorToolbar from "./editor/EditorToolbar";
import RefineOverlay from "./editor/RefineOverlay";
import { useEditorStore } from "./editor/useEditorStore";
import { useImageProcessor } from "./editor/useImageProcessor";

interface ImageEditorProps {
	image: string;
	sourceImage: string | null;
	onSave: (editedImageUrl: string) => void;
	onCancel: () => void;
}

export default function ImageEditor({
	image,
	sourceImage,
	onSave,
	onCancel,
}: ImageEditorProps): React.JSX.Element {
	// Initialize store with props
	const {
		initializeEditor,
		processedImageSource,
		rotation,
		bgColor,
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

	const getCroppedImg = async () => {
		if (!croppedAreaPixels) return;
		try {
			const img = await createImage(processedImageSource);
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			canvas.width = croppedAreaPixels.width;
			canvas.height = croppedAreaPixels.height;

			if (bgColor !== "transparent") {
				ctx.fillStyle = bgColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			const maxSize = Math.max(img.width, img.height);
			const safeCanvas = document.createElement("canvas");
			safeCanvas.width = maxSize * 2;
			safeCanvas.height = maxSize * 2;
			const safeCtx = safeCanvas.getContext("2d");
			if (!safeCtx) return;

			safeCtx.translate(maxSize, maxSize);
			safeCtx.rotate((rotation * Math.PI) / 180);
			safeCtx.drawImage(img, -img.width / 2, -img.height / 2);

			ctx.drawImage(
				safeCanvas,
				croppedAreaPixels.x + maxSize - img.width / 2,
				croppedAreaPixels.y + maxSize - img.height / 2,
				croppedAreaPixels.width,
				croppedAreaPixels.height,
				0,
				0,
				croppedAreaPixels.width,
				croppedAreaPixels.height,
			);

			return new Promise<string>((res) =>
				canvas.toBlob((b) => {
					if (b) res(URL.createObjectURL(b));
				}, "image/png"),
			);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSave = async () => {
		const url = await getCroppedImg();
		if (url) onSave(url);
	};

	return (
		<div className="w-full h-full bg-background flex flex-col items-center justify-center">
			<div className="w-full h-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
				{/* Workspace */}
				<div className="flex-1 relative bg-muted overflow-hidden">
					{isCleanupMode ? <RefineOverlay /> : <CropperWorkspace />}

					{/* Header Overlays */}
					<EditorToolbar onExit={onCancel} onSave={handleSave} />
				</div>

				{/* Sidebar */}
				<EditorSidebar />
			</div>
		</div>
	);
}
