import type React from "react";

interface BadgeProps {
	children: React.ReactNode;
	variant?: "indigo" | "slate" | "green" | "rose" | "amber";
	className?: string;
}

const Badge: React.FC<BadgeProps> = ({
	children,
	variant = "indigo",
	className = "",
}) => {
	const variants = {
		indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
		slate: "bg-slate-50 text-slate-600 border-slate-100",
		green: "bg-emerald-50 text-emerald-600 border-emerald-100",
		rose: "bg-rose-50 text-rose-600 border-rose-100",
		amber: "bg-amber-50 text-amber-600 border-amber-100",
	};

	return (
		<span
			className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${variants[variant]} ${className}`}
		>
			{children}
		</span>
	);
};

export default Badge;
