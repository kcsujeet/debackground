export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="relative py-20 px-6 border-t border-border bg-card">
			<div className="max-w-[1400px] mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
					<div className="col-span-1 md:col-span-2 space-y-6">
						<div className="flex items-center gap-2 text-sm font-medium">
							<img src="/logo.svg" alt="Unbgly Logo" className="w-8 h-8" />
							<span className="text-foreground font-bold text-lg">Unbgly</span>
						</div>
						<p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
							Professional-grade background removal. 100% local, 100% private,
							and completely free.
						</p>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-foreground">Legal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<a
									href="/privacy"
									className="hover:text-foreground transition-colors"
								>
									Privacy Policy
								</a>
							</li>
							<li>
								<a
									href="/terms"
									className="hover:text-foreground transition-colors"
								>
									Terms of Service
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8 border-t border-border">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>© {currentYear} Unbgly. All rights reserved.</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
