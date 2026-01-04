import { useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
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

	return (
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
			style={{
				containerStyle: {
					backgroundColor: bgColor === "transparent" ? undefined : bgColor,
					backgroundImage:
						bgColor === "transparent"
							? "url('https://www.transparenttextures.com/patterns/checkerboard.png')"
							: "none",
				},
			}}
		/>
	);
}
