import { useRef } from "react";
import { useEditorStore } from "./useEditorStore";

export default function RefineOverlay() {
	const {
		processedImageSource,
		manualMaskCanvas,
		brushMode,
		brushSize,
		refineZoom,
		isDrawing,
		setIsDrawing,
		drawOnMask,
		incrementMaskCounter,
	} = useEditorStore();

	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const cursorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
		if (!cursorRef.current) return;
		const container = e.currentTarget as HTMLElement;
		const rect = container.getBoundingClientRect();
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

		// Update cursor position directly to avoid React re-renders (lag)
		const x = clientX - rect.left;
		const y = clientY - rect.top;

		// Show cursor
		cursorRef.current.style.display = "block";
		cursorRef.current.style.left = `${x}px`;
		cursorRef.current.style.top = `${y}px`;

		if (!isDrawing && !manualMaskCanvas) return;

		const img = (e.currentTarget as HTMLElement).querySelector("img");
		if (!img) return;
		const imgRect = img.getBoundingClientRect();

		// Calculate scaling ratio to match brush visual size to actual canvas stroke size
		const scale = manualMaskCanvas ? imgRect.width / manualMaskCanvas.width : 1;
		const visualSize = brushSize * scale;

		cursorRef.current.style.width = `${visualSize}px`;
		cursorRef.current.style.height = `${visualSize}px`;
		cursorRef.current.style.borderColor =
			brushMode === "eraser" ? "#f43f5e" : "#10b981";

		if (!isDrawing || !manualMaskCanvas) return;

		// Calculate relative coordinates for drawing
		const relX =
			(clientX - imgRect.left) * (manualMaskCanvas.width / imgRect.width);
		const relY =
			(clientY - imgRect.top) * (manualMaskCanvas.height / imgRect.height);

		// 1. Update the actual data mask (persisted)
		drawOnMask(relX, relY);

		// 2. Draw on the preview canvas (visual feedback)
		const pCtx = previewCanvasRef.current?.getContext("2d");
		if (pCtx) {
			pCtx.lineWidth = brushSize;
			pCtx.lineCap = "round";
			pCtx.lineJoin = "round";
			// Use correct colors for preview: transparent red for erase, green for restore
			pCtx.strokeStyle =
				brushMode === "eraser"
					? "rgba(239, 68, 68, 0.5)"
					: "rgba(16, 185, 129, 0.5)"; // Red-500 / Emerald-500

			pCtx.lineTo(relX, relY);
			pCtx.stroke();
			pCtx.beginPath();
			pCtx.moveTo(relX, relY);
		}
	};

	const handleUp = () => {
		setIsDrawing(false);
		// Commit the changes by triggering re-process
		incrementMaskCounter();

		// Clear the preview canvas now that the main image will re-render with the mask applied
		const pCtx = previewCanvasRef.current?.getContext("2d");
		if (pCtx && previewCanvasRef.current) {
			pCtx.clearRect(
				0,
				0,
				previewCanvasRef.current.width,
				previewCanvasRef.current.height,
			);
			pCtx.beginPath(); // Reset path
		}
	};

	const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
		e.preventDefault(); // Prevent auto-scroll behavior
		setIsDrawing(true);
		// Initialize path on preview canvas
		const pCtx = previewCanvasRef.current?.getContext("2d");
		if (pCtx) {
			pCtx.beginPath();

			// Move to start position in canvas coordinates
			const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
			const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

			if (manualMaskCanvas) {
				const img = (e.currentTarget as HTMLElement).querySelector("img");
				if (img) {
					const imgRect = img.getBoundingClientRect();
					const relX =
						(clientX - imgRect.left) * (manualMaskCanvas.width / imgRect.width);
					const relY =
						(clientY - imgRect.top) *
						(manualMaskCanvas.height / imgRect.height);
					pCtx.moveTo(relX, relY);
				}
			}
		}
		handleMouseMove(e);
	};

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center cursor-crosshair"
			onMouseDown={handleStart}
			onMouseMove={handleMouseMove}
			onMouseUp={handleUp}
			onMouseLeave={() => {
				handleUp();
				if (cursorRef.current) cursorRef.current.style.display = "none";
			}}
			onMouseEnter={() => {
				if (cursorRef.current) cursorRef.current.style.display = "block";
			}}
			onTouchStart={handleStart}
			onTouchMove={handleMouseMove}
			onTouchEnd={handleUp}
			role="application"
			aria-label="Image refinement drawing area"
		>
			<div
				className="relative w-fit h-fit"
				style={{
					transform: `scale(${refineZoom})`,
					transformOrigin: "center center",
					transition: "transform 0.15s ease-out",
				}}
			>
				<div className="relative grid place-items-center">
					<img
						src={processedImageSource}
						alt="Refine"
						className="col-start-1 row-start-1 max-w-[85vw] max-h-[85vh] w-auto h-auto block pointer-events-none select-none bg-white bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]"
					/>
					{/* Live Preview Canvas */}
					<canvas
						ref={previewCanvasRef}
						width={manualMaskCanvas?.width}
						height={manualMaskCanvas?.height}
						className="col-start-1 row-start-1 w-full h-full pointer-events-none"
					/>
				</div>
			</div>
			<div
				ref={cursorRef}
				className="absolute pointer-events-none"
				style={{
					position: "absolute",
					borderRadius: "50%",
					transform: "translate(-50%, -50%)",
					boxShadow: "0 0 15px rgba(0,0,0,0.5)",
					border: "2px solid #f43f5e", // Default, updated via JS
					display: "none", // Hidden initially
					pointerEvents: "none",
				}}
			/>
		</div>
	);
}
