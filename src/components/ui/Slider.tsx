import type React from "react";

interface SliderProps {
	label?: string;
	min: number;
	max: number;
	step?: number;
	value: number;
	onChange: (value: number) => void;
	icon?: React.ReactNode;
}

const Slider: React.FC<SliderProps> = ({
	label,
	min,
	max,
	step = 1,
	value,
	onChange,
	icon,
}) => {
	const progress = ((value - min) / (max - min)) * 100;

	return (
		<div className="space-y-3 w-full">
			{label && (
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
						{icon} {label}
					</span>
					<span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
						{value.toFixed(1)}
					</span>
				</div>
			)}
			<div className="relative h-6 flex items-center group">
				<div className="absolute w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
					<div
						className="h-full bg-indigo-500 transition-all duration-150"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					className="absolute w-full h-full opacity-0 cursor-pointer z-10"
				/>
				<div
					className="absolute w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-md transition-all duration-150 group-hover:scale-125 pointer-events-none"
					style={{ left: `calc(${progress}% - 8px)` }}
				/>
			</div>
		</div>
	);
};

export default Slider;
