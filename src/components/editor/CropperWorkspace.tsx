import { useCallback } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useEditorStore } from "./useEditorStore";

export default function CropperWorkspace() {
	const {
		processedImageSource,
		crop,
		setCrop,
		zoom,
		setZoom,
		aspect,
		setAspect,
		rotation,
		bgColor,
		setCroppedAreaPixels,
	} = useEditorStore();

	const onCropComplete = useCallback(
		(_area: Area, pixels: Area) => setCroppedAreaPixels(pixels),
		[setCroppedAreaPixels],
	);

	// Wheel event for zoom and pan (Unified)
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			// Zoom: Alt (Photoshop default) OR Ctrl/Meta (Trackpad pinch)
			if (e.altKey || e.ctrlKey || e.metaKey) {
				const zoomSpeed = 0.005;
				const delta = -e.deltaY;
				setZoom((prev: number) => {
					const next = prev + delta * zoomSpeed;
					return Math.max(1, Math.min(next, 3)); // Match slider range
				});
				return;
			}

			// Panning: Mouse wheel or trackpad scroll
			const panSpeed = 0.5;
			setCrop((prev: Point) => ({
				x: prev.x - e.deltaX * panSpeed,
				y: prev.y - e.deltaY * panSpeed,
			}));
		},
		[setZoom, setCrop],
	);

	return (
		<div className="w-full h-full relative" onWheel={handleWheel}>
			<Cropper
				image={processedImageSource}
				crop={crop}
				zoom={zoom}
				aspect={aspect}
				rotation={rotation}
				onCropChange={setCrop}
				onZoomChange={setZoom}
				onMediaLoaded={(mediaSize) => {
					setAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
				}}
				onCropComplete={onCropComplete}
				zoomWithScroll={false} // Disable default to use our Alt+Wheel
				style={{
					containerStyle: {
						backgroundColor: bgColor === "transparent" ? undefined : bgColor,
					},
				}}
				classes={{
					containerClassName: bgColor === "transparent" ? "bg-checkered" : "",
				}}
			/>
		</div>
	);
}
