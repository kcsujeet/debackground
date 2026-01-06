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
		<div
			ref={containerRef}
			className={`relative w-full h-full overflow-hidden cursor-ew-resize select-none flex items-center justify-center ${showCheckered ? "" : "bg-card"}`}
			onMouseDown={handleMouseDown}
			onTouchStart={handleMouseDown}
			role="img"
			aria-label="Interactive before and after comparison slider"
		>
			{/* Shared Image container to ensure both images occupy the same space */}
			<div className="relative w-full h-full flex items-center justify-center">
				{/* After image (background removed) - Base image */}
				<img
					src={afterImage}
					alt="Background removed result"
					className="w-full h-full object-contain"
					draggable={false}
				/>

				{/* Before image (with background) - Clipped Overlay */}
				<div
					className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
					style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
				>
					<img
						src={beforeImage}
						alt="Original with background"
						className="w-full h-full object-contain"
						draggable={false}
					/>
				</div>

				{/* Slider line and handle - Positioned relative to the image container */}
				<div
					className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-10"
					style={{ left: `${sliderPosition}%` }}
				>
					{/* Handle */}
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize">
						<ChevronsLeftRight className="size-6 text-primary" />
					</div>
				</div>
			</div>
		</div>
	);
}
