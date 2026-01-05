import { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";

export default function RefineOverlay() {
	const {
		processedImageSource,
		manualMaskCanvas,
		brushMode,
		brushSize,
		refineZoom,
		setRefineZoom,
		refinePan,
		setRefinePan,
		isSpacePressed,
		isDrawing,
		setIsDrawing,
		drawOnMask,
		incrementMaskCounter,
	} = useEditorStore();

	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const cursorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const lastPosRef = useRef<{ x: number; y: number } | null>(null);

	// cursorRef logic remains, but we don't need the window listeners here anymore
	useEffect(() => {
		if (isSpacePressed) {
			if (cursorRef.current) cursorRef.current.style.display = "none";
		} else {
			if (cursorRef.current) cursorRef.current.style.display = "block";
		}
	}, [isSpacePressed]);

	// Wheel event for zoom and pan
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();

			// Zoom: Alt (Photoshop default) OR Ctrl/Meta (Trackpad pinch)
			if (e.altKey || e.ctrlKey || e.metaKey) {
				const zoomSpeed = 0.005;
				const delta = -e.deltaY;
				setRefineZoom((prev) => {
					const next = prev + delta * zoomSpeed;
					return Math.max(0.2, Math.min(next, 10));
				});
				return;
			}

			// Panning: Mouse wheel or trackpad scroll
			const panSpeed = 1.0;
			setRefinePan((prev) => ({
				x: prev.x - e.deltaX * panSpeed,
				y: prev.y - e.deltaY * panSpeed,
			}));
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [setRefineZoom, setRefinePan]);

	const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

		// 1. Panning logic
		if (isSpacePressed) {
			if (isDrawing && lastPosRef.current) {
				const dx = clientX - lastPosRef.current.x;
				const dy = clientY - lastPosRef.current.y;
				setRefinePan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
				lastPosRef.current = { x: clientX, y: clientY };
			}
			return;
		}

		// 2. Drawing/Cursor logic
		if (!cursorRef.current) return;
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();

		const x = clientX - rect.left;
		const y = clientY - rect.top;

		cursorRef.current.style.display = "block";
		cursorRef.current.style.left = `${x}px`;
		cursorRef.current.style.top = `${y}px`;

		const img = container.querySelector("img");
		if (!img) return;
		const imgRect = img.getBoundingClientRect();

		const scale = manualMaskCanvas ? imgRect.width / manualMaskCanvas.width : 1;
		const visualSize = brushSize * scale;

		cursorRef.current.style.width = `${visualSize}px`;
		cursorRef.current.style.height = `${visualSize}px`;
		cursorRef.current.style.borderColor =
			brushMode === "eraser" ? "#f43f5e" : "#10b981";

		if (!isDrawing || !manualMaskCanvas) return;

		const relX =
			(clientX - imgRect.left) * (manualMaskCanvas.width / imgRect.width);
		const relY =
			(clientY - imgRect.top) * (manualMaskCanvas.height / imgRect.height);

		drawOnMask(relX, relY, false);

		const pCtx = previewCanvasRef.current?.getContext("2d");
		if (pCtx) {
			pCtx.lineWidth = brushSize;
			pCtx.lineCap = "round";
			pCtx.lineJoin = "round";
			pCtx.strokeStyle =
				brushMode === "eraser"
					? "rgba(239, 68, 68, 0.5)"
					: "rgba(16, 185, 129, 0.5)";

			pCtx.lineTo(relX, relY);
			pCtx.stroke();
			pCtx.beginPath();
			pCtx.moveTo(relX, relY);
		}
	};

	const handleUp = () => {
		setIsDrawing(false);
		lastPosRef.current = null;

		if (!isSpacePressed) {
			incrementMaskCounter();
			const pCtx = previewCanvasRef.current?.getContext("2d");
			if (pCtx && previewCanvasRef.current) {
				pCtx.clearRect(
					0,
					0,
					previewCanvasRef.current.width,
					previewCanvasRef.current.height,
				);
				pCtx.beginPath();
			}
		}
	};

	const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

		setIsDrawing(true);
		lastPosRef.current = { x: clientX, y: clientY };

		if (isSpacePressed) return;

		const pCtx = previewCanvasRef.current?.getContext("2d");
		if (pCtx && manualMaskCanvas) {
			pCtx.beginPath();
			const img = (e.currentTarget as HTMLElement).querySelector("img");
			if (img) {
				const imgRect = img.getBoundingClientRect();
				const relX =
					(clientX - imgRect.left) * (manualMaskCanvas.width / imgRect.width);
				const relY =
					(clientY - imgRect.top) * (manualMaskCanvas.height / imgRect.height);
				pCtx.moveTo(relX, relY);
				drawOnMask(relX, relY, true);
			}
		}
		handleMouseMove(e);
	};

	return (
		<div
			ref={containerRef}
			className={`absolute inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center ${isSpacePressed ? (isDrawing ? "cursor-grabbing" : "cursor-grab") : "cursor-none"}`}
			onMouseDown={handleStart}
			onMouseMove={handleMouseMove}
			onMouseUp={handleUp}
			onMouseLeave={() => {
				handleUp();
				if (cursorRef.current) cursorRef.current.style.display = "none";
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
					transform: `translate(${refinePan.x}px, ${refinePan.y}px) scale(${refineZoom})`,
					transformOrigin: "center center",
					transition: isDrawing ? "none" : "transform 0.15s ease-out",
				}}
			>
				<div className="relative grid place-items-center">
					<img
						src={processedImageSource}
						alt="Refine"
						className="col-start-1 row-start-1 max-w-[85vw] max-h-[85vh] w-auto h-auto block pointer-events-none select-none bg-checkered"
					/>
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
					border: "2px solid #f43f5e",
					display: "none",
					pointerEvents: "none",
					zIndex: 100,
				}}
			/>
		</div>
	);
}
