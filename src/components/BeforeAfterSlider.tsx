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
			className={`relative w-full aspect-16/10 rounded-xl overflow-hidden cursor-ew-resize select-none border border-border shadow-2xl ${showCheckered ? "bg-checkered" : "bg-card"}`}
			onMouseDown={handleMouseDown}
			onTouchStart={handleMouseDown}
			role="img"
			aria-label="Interactive before and after comparison slider"
		>
			{/* After image (background removed) - full width */}
			<div className="absolute inset-0">
				<img
					src={afterImage}
					alt="Background removed result"
					className="w-full h-full object-cover"
					draggable={false}
				/>
			</div>

			{/* Before image (with background) - clipped */}
			<div
				className="absolute inset-0 overflow-hidden"
				style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
			>
				<img
					src={beforeImage}
					alt="Original with background"
					className="w-full h-full object-cover"
					draggable={false}
				/>
			</div>

			{/* Slider line and handle */}
			<div
				className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl"
				style={{ left: `${sliderPosition}%` }}
			>
				{/* Handle */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize">
					<ChevronsLeftRight className="size-8 text-primary" />
				</div>
			</div>
		</div>
	);
}
