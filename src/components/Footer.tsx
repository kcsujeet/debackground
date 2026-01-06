import { Zap } from "lucide-react";

export default function Footer() {
	return (
		<footer className="relative py-20 px-6 border-t border-border bg-card">
			<div className="max-w-[1400px] mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
					<div className="col-span-1 md:col-span-2 space-y-6">
						<div className="flex items-center gap-2 text-sm font-medium">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<Zap className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
							</div>
							<span className="text-foreground font-bold text-lg">PureBG</span>
						</div>
						<p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
							Professional-grade background removal. 100% local, 100% private,
							and completely free.
						</p>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-foreground">Product</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<a
									href="/remove"
									className="hover:text-foreground transition-colors"
								>
									Remover
								</a>
							</li>
							<li>
								<a
									href="/#features"
									className="hover:text-foreground transition-colors"
								>
									Features
								</a>
							</li>
							<li>
								<a
									href="/#how-it-works"
									className="hover:text-foreground transition-colors"
								>
									How it works
								</a>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-foreground">Legal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<a href="/" className="hover:text-foreground transition-colors">
									Privacy Policy
								</a>
							</li>
							<li>
								<a href="/" className="hover:text-foreground transition-colors">
									Terms of Service
								</a>
							</li>
							<li>
								<a href="/" className="hover:text-foreground transition-colors">
									Cookie Policy
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>© 2026 PureBG AI. All rights reserved.</span>
					</div>
					<div className="flex items-center gap-6 text-xs text-muted-foreground">
						<a
							href="https://github.com"
							className="hover:text-foreground transition-colors"
						>
							GitHub
						</a>
						<a
							href="https://twitter.com"
							className="hover:text-foreground transition-colors"
						>
							Twitter
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
