import { ChevronsLeftRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
	beforeImage: string;
	afterImage: string;
	showCheckered?: boolean;
}

export default function BeforeAfterSlider({
	beforeImage,
	afterImage,
	showCheckered = true,
}: BeforeAfterSliderProps) {
	const [sliderPosition, setSliderPosition] = useState(50);
	const [isDragging, setIsDragging] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleMove = useCallback((clientX: number) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
		const percentage = (x / rect.width) * 100;
		setSliderPosition(percentage);
	}, []);

	const handleMouseDown = useCallback(() => setIsDragging(true), []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging) return;
			handleMove(e.clientX);
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (!isDragging) return;
			handleMove(e.touches[0].clientX);
		};

		const handleEnd = () => setIsDragging(false);

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleEnd);
			window.addEventListener("touchmove", handleTouchMove, { passive: false });
			window.addEventListener("touchend", handleEnd);

			return () => {
				window.removeEventListener("mousemove", handleMouseMove);
				window.removeEventListener("mouseup", handleEnd);
				window.removeEventListener("touchmove", handleTouchMove);
				window.removeEventListener("touchend", handleEnd);
			};
		}
	}, [isDragging, handleMove]);

	return (
		<div className="w-full h-full flex items-center justify-center p-4">
			{/* 
				Interactive Container:
				- Uses inline-block to shrink-wrap the base image.
				- containerRef is attached here for correct coordinate calculations.
			*/}
			<div
				ref={containerRef}
				className={`relative inline-block overflow-hidden cursor-ew-resize select-none rounded-lg shadow-xl ${showCheckered ? "bg-checkered" : "bg-card"}`}
				onMouseDown={handleMouseDown}
				onTouchStart={handleMouseDown}
				role="img"
				aria-label="Interactive before and after comparison slider"
			>
				{/* 
					Base Image (After):
					- This image establishes the dimensions of the parent div.
					- max-h-[70vh] ensures it fits within the viewport.
				*/}
				<img
					src={afterImage}
					alt="Background removed result"
					className="block max-w-full max-h-[70vh] w-auto h-auto pointer-events-none"
					draggable={false}
				/>

				{/* 
					Overlay Image (Before):
					- Positioned absolutely to cover the base image exactly.
					- object-cover ensures it scales identically to the base image.
				*/}
				<div
					className="absolute inset-0 overflow-hidden pointer-events-none"
					style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
				>
					<img
						src={beforeImage}
						alt="Original with background"
						className="block w-full h-full object-cover pointer-events-none"
						draggable={false}
					/>
				</div>

				{/* Slider line and handle */}
				<div
					className="absolute top-0 bottom-0 w-0.5 shadow z-10"
					style={{ left: `${sliderPosition}%` }}
				>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize active:scale-95 transition-transform border border-border">
						<ChevronsLeftRight className="size-5 text-primary" />
					</div>
				</div>
			</div>
		</div>
	);
}
