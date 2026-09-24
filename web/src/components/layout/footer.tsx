import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
	const { t, locale } = useTranslation();
	const currentYear = new Date().getFullYear().toString();

	const copyrightText = t.footer.copyright.replace("{year}", currentYear);

	return (
		<footer className="w-full border-t border-border/80 bg-muted/30 text-foreground">
			<div className="container mx-auto px-4 py-12 sm:px-6 lg:py-16">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
					{/* Brand Column */}
					<div className="space-y-4 lg:col-span-2">
						<Link to="/$locale" params={{ locale }} className="inline-block">
							<img
								src="/sayaratak-logo.svg"
								alt="Sayaratak"
								className="h-8 w-auto object-contain"
							/>
						</Link>
						<p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
							{t.footer.tagline}
						</p>
					</div>

					{/* Marketplace Links */}
					<div className="space-y-3">
						<h4 className="text-sm font-semibold tracking-wider text-foreground">
							{t.footer.marketplace}
						</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link
									to="/$locale/listings"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.common.cars}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale/dealerships"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.common.dealerships}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale/workshops"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.common.workshops}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale/mechanics"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.common.mechanics}
								</Link>
							</li>
						</ul>
					</div>

					{/* Services & Plans */}
					<div className="space-y-3">
						<h4 className="text-sm font-semibold tracking-wider text-foreground">
							{t.footer.services}
						</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link
									to="/$locale"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.common.pricing}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale/dashboard/listings/new"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.nav.postAd}
								</Link>
							</li>
						</ul>
					</div>

					{/* Company & Legal */}
					<div className="space-y-3">
						<h4 className="text-sm font-semibold tracking-wider text-foreground">
							{t.footer.company}
						</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link
									to="/$locale"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.footer.aboutUs}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.footer.contactUs}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.footer.privacyPolicy}
								</Link>
							</li>
							<li>
								<Link
									to="/$locale"
									params={{ locale }}
									className="hover:text-foreground transition-colors"
								>
									{t.footer.termsOfService}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-12 border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
					<p>{copyrightText}</p>
					<p>Sudan • سودان</p>
				</div>
			</div>
		</footer>
	);
}
