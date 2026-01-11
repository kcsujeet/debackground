export default function Header() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
			<div className="max-w-[1400px] mx-auto px-6 md:px-8">
				<div className="flex items-center justify-between h-16">
					<a
						href="/"
						className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
					>
						<img
							src="/favicon.svg"
							alt="Debackground - AI Background Remover"
							className="w-8 h-8"
						/>
						<span className="text-foreground font-bold tracking-tight text-lg font-heading">
							Debackground
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
							href="/remove"
							className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
						>
							Get started
						</a>
					</div>

					<a
						href="/remove"
						className="md:hidden px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-semibold text-xs hover:bg-primary/90 transition-all"
					>
						Start
					</a>
				</div>
			</div>
		</nav>
	);
}
