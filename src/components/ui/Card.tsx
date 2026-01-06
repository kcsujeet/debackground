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
			className={`bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col ${className}`}
		>
			{(title || actions) && (
				<div className="px-6 py-4 border-b border-border flex items-center justify-between">
					<div className="flex-1">
						{title &&
							(typeof title === "string" ? (
								<h3 className="text-lg font-bold tracking-tight text-card-foreground">
									{title}
								</h3>
							) : (
								title
							))}
					</div>
					{actions && <div className="flex items-center gap-3">{actions}</div>}
				</div>
			)}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
};

export default Card;
