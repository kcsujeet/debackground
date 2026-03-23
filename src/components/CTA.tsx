import { ArrowRight, Sparkles } from "lucide-react";

export default function CTA() {
	return (
		<section className="relative py-24 overflow-hidden">
			{/* Background Glows similar to Hero/Features */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[600px] bg-primary/5 blur-[120px] -z-10 rounded-full"></div>

			<div className="max-w-[1400px] mx-auto px-6 md:px-8">
				<div className="max-w-4xl mx-auto text-center space-y-10">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border text-xs text-muted-foreground font-medium">
						<Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
						Start creating today
					</div>

					<h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-foreground">
						Ready to <span className="text-primary font-heading">transform</span> <br className="hidden md:block" />
						your images?
					</h2>

					<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
						Join thousands of creators using deBackground to get studio-quality{" "}
						<strong>background removal</strong> running entirely in your browser.
						Unlimited use, no accounts, and 100% free.
					</p>

					<div className="flex justify-center pt-4">
						<a
							href="/remove"
							className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 transition-all flex items-center gap-3 shadow-xl shadow-primary/10"
						>
							Start removing for free
							<ArrowRight
								className="w-5 h-5 group-hover:translate-x-1 transition-transform"
								aria-hidden="true"
							/>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
