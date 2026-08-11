import { Heart } from "lucide-react";
import { DONATION_LINK } from "@/lib/constants";

export default function Header() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
			<div className="max-w-[1400px] mx-auto px-6 md:px-8">
				<div className="flex items-center justify-between h-16">
					<a
						href="/"
						className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
					>
						<img
							src="/favicon.svg"
							alt="deBackground - AI Background Remover"
							className="w-8 h-8"
						/>
						<span className="text-foreground font-bold tracking-tight text-lg font-heading">
							deBackground
						</span>
					</a>

					<div className="hidden md:flex items-center gap-4 text-sm">
						<a
							href="/#features"
							className="text-muted-foreground hover:text-foreground transition-colors font-medium"
						>
							Features
						</a>
						<div className="h-4 w-px bg-border"></div>
						<a
							href={DONATION_LINK}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 px-4 py-1.5 text-muted-foreground hover:text-rose-500 transition-all font-medium group"
						>
							<Heart className="w-4 h-4 fill-rose-500 text-rose-500 group-hover:fill-rose-600 group-hover:text-rose-600 transition-all" />
							<span>Donate</span>
						</a>
						<a
							href="/remove"
							className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
						>
							Get started
						</a>
					</div>

					<div className="flex items-center gap-2 md:hidden">
						<a
							href={DONATION_LINK}
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 text-muted-foreground hover:text-rose-500 transition-all"
						>
							<Heart className="w-5 h-5 fill-rose-500 text-rose-500 hover:fill-rose-600 hover:text-rose-600 transition-all" />
						</a>
						<a
							href="/remove"
							className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-semibold text-xs hover:bg-primary/90 transition-all"
						>
							Start
						</a>
					</div>
				</div>
			</div>
		</nav>
	);
}
