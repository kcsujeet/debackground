import type React from "react";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	title?: React.ReactNode;
	actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
	children,
	className = "",
	title,
	actions,
}) => {
	return (
		<div
			className={`bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col ${className}`}
		>
			{(title || actions) && (
				<div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white">
					{title &&
						(typeof title === "string" ? (
							<h3 className="text-lg font-bold text-slate-800">{title}</h3>
						) : (
							title
						))}
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			)}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
};

export default Card;
