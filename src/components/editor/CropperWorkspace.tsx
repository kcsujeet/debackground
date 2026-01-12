import { useEffect, useRef } from "react";
import ReactCrop, {
	type Crop,
	centerCrop,
	makeAspectCrop,
	type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useEditorStore } from "./useEditorStore";

export default function CropperWorkspace() {
	const {
		processedImageSource,
		crop,
		setCrop,
		aspect,
		setImageAspect,
		rotation,
		zoom,
		bgColor,
		bgImage,
		filters,
		setCroppedAreaPixels,
	} = useEditorStore();

	const imgRef = useRef<HTMLImageElement>(null);

	// Build CSS filter string from filter values
	const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`;

	// Handle aspect ratio changes
	useEffect(() => {
		if (imgRef.current && aspect) {
			const { width, height } = imgRef.current;
			const newCrop = centerCrop(
				makeAspectCrop(
					{
						unit: "%",
						width: 90,
					},
					aspect,
					width,
					height,
				),
				width,
				height,
			);
			setCrop(newCrop);
		}
	}, [aspect, setCrop]);

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const { width, height } = e.currentTarget;
		setImageAspect(width / height);

		// Initialize center crop if no crop exists or it's default
		if (crop.width === 0 || crop.width === 100) {
			const initialCrop = centerCrop(
				makeAspectCrop(
					{
						unit: "%",
						width: 90,
					},
					aspect || width / height,
					width,
					height,
				),
				width,
				height,
			);
			setCrop(initialCrop);
		}
	};

	const onCropChange = (c: Crop) => {
		setCrop(c);
	};

	const onCropComplete = (c: PixelCrop) => {
		if (imgRef.current) {
			const { naturalWidth, naturalHeight, width, height } = imgRef.current;
			const scaleX = naturalWidth / width;
			const scaleY = naturalHeight / height;

			setCroppedAreaPixels({
				unit: "px",
				x: c.x * scaleX,
				y: c.y * scaleY,
				width: c.width * scaleX,
				height: c.height * scaleY,
			});
		}
	};

	return (
		<div className="w-full h-full relative flex items-center justify-center bg-muted p-4 sm:p-8 overflow-hidden select-none">
			<div
				className="relative shadow-2xl transition-transform duration-300 overflow-hidden"
				style={{
					transform: `rotate(${rotation}deg) scale(${zoom})`,
				}}
			>
				{/* Background Layer - receives filters */}
				{bgImage ? (
					<div
						className="absolute -inset-px z-0"
						style={{
							backgroundImage: `url(${bgImage})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							filter: filterStyle,
						}}
					/>
				) : bgColor !== "transparent" ? (
					<div
						className="absolute -inset-px z-0"
						style={{
							backgroundColor: bgColor,
							filter: filterStyle,
						}}
					/>
				) : (
					<div className="absolute inset-0 z-0 bg-checkered" />
				)}

				{/* Subject Layer - no filters */}
				<ReactCrop
					crop={crop}
					onChange={onCropChange}
					onComplete={onCropComplete}
					aspect={aspect}
					className="max-w-full max-h-full relative z-10 block"
					style={{ display: "block" }}
					ruleOfThirds
				>
					<img
						ref={imgRef}
						src={processedImageSource}
						alt="Crop workspace"
						onLoad={onImageLoad}
						style={{
							maxHeight: "60vh",
							width: "auto",
							display: "block",
						}}
						draggable={false}
					/>
				</ReactCrop>
			</div>
		</div>
	);
}
