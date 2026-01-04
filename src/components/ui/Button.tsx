import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
	size?: "sm" | "md" | "lg" | "xl";
	isLoading?: boolean;
	icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = "primary",
	size = "md",
	isLoading = false,
	icon,
	className = "",
	disabled,
	...props
}) => {
	const baseStyles =
		"inline-flex items-center justify-center font-bold transition-all duration-200 rounded-2xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

	const variants = {
		primary:
			"bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 focus:ring-indigo-600/20",
		secondary:
			"bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-100/50",
		ghost:
			"bg-transparent text-slate-500 hover:bg-slate-100 focus:ring-slate-100/50",
		danger:
			"bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 focus:ring-rose-500/20",
		outline:
			"bg-transparent border-2 border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 focus:ring-indigo-600/10",
	};

	const sizes = {
		sm: "px-3 py-1.5 text-xs gap-1.5",
		md: "px-5 py-2.5 text-sm gap-2",
		lg: "px-7 py-3 text-base gap-2.5",
		xl: "px-9 py-4 text-lg gap-3",
	};

	return (
		<button
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
			) : (
				<>
					{icon && <span className="flex-shrink-0">{icon}</span>}
					{children}
				</>
			)}
		</button>
	);
};

export default Button;
