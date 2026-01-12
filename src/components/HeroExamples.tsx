import { User } from "lucide-react";
import { useState } from "react";
import BeforeAfterSlider from "./BeforeAfterSlider";

const EXAMPLES = [
	{
		id: "people",
		label: "People",
		icon: User,
		before: "/images/hero-person-before.png",
		after: "/images/hero-person-after.png",
	},
	// {
	// 	id: "animals",
	// 	label: "Animals",
	// 	icon: Dog,
	// 	before: "/images/hero-animal-before.png",
	// 	after: "/images/hero-animal-after.png",
	// },
	// {
	// 	id: "products",
	// 	label: "Products",
	// 	icon: ShoppingBag,
	// 	before: "/images/hero-product-before.png",
	// 	after: "/images/hero-product-after.png",
	// },
	// {
	// 	id: "demo",
	// 	label: "Graphics",
	// 	icon: ImageIcon,
	// 	before: "/images/demo-before.png",
	// 	after: "/images/demo-after.png",
	// },
];

export default function HeroExamples() {
	const [activeId, _setActiveId] = useState(EXAMPLES[0].id);
	const activeExample =
		EXAMPLES.find((ex) => ex.id === activeId) || EXAMPLES[0];

	return (
		<div className="flex flex-col gap-12 w-full">
			{/* Lead-in Header */}
			<div className="flex flex-col items-center gap-3 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
				<div className="h-12 w-px bg-linear-to-b from-transparent to-border"></div>
				<span className="text-sm font-semibold text-primary uppercase tracking-widest px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
					See the magic
				</span>
				<h2 className="text-2xl md:text-3xl font-bold text-foreground">
					Precision in every pixel
				</h2>
			</div>

			{/* Category Selector */}
			{/* <div className="flex items-center gap-2 md:gap-4 p-1.5 bg-card rounded-full w-fit max-w-full mx-auto overflow-x-auto scrollbar-none flex-nowrap px-4 md:px-1.5">
				{EXAMPLES.map((example) => {
					const Icon = example.icon;
					const isActive = activeId === example.id;
					return (
						<button
							key={example.id}
							type="button"
							onClick={() => setActiveId(example.id)}
							className={`
								flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0
								${
									isActive
										? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
										: "bg-card hover:bg-muted text-muted-foreground border border-border"
								}
							`}
						>
							<Icon className={`size-4 ${isActive ? "animate-pulse" : ""}`} />
							{example.label}
						</button>
					);
				})}
			</div> */}

			{/* Slider Container */}
			<div className="relative group p-2 rounded-3xl bg-card shadow-2xl overflow-hidden transition-all duration-500">
				<div className="absolute -inset-4 bg-linear-to-r from-primary/10 to-primary/5 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
				<div className="relative rounded-2xl overflow-hidden">
					<BeforeAfterSlider
						key={activeId} // Key ensures re-mount for fresh animations if any
						showCheckered={false}
						beforeImage={activeExample.before}
						afterImage={activeExample.after}
					/>
				</div>
			</div>

			{/* Hint */}
			<p className="text-center text-xs text-muted-foreground animate-pulse">
				Drag the slider to see the magic
			</p>
		</div>
	);
}
