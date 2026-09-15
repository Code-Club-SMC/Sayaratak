import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

/**
 * Public homepage — the main landing page for Sayaratak.
 *
 * TODO: Phase 2 — Featured listings carousel, category grid,
 * banners, nearby listings, dealership highlights.
 */
export const Route = createFileRoute("/$locale/_public/")({
	component: HomePage,
});

function HomePage() {
	const { t, locale, dir } = useTranslation();

	return (
		<div className="container mx-auto px-4 py-12">
			<h1 className="text-4xl font-bold tracking-tight">
				{locale === "ar" ? "مرحباً بك في سيارتك" : "Welcome to Sayaratak"}
			</h1>
			<p className="mt-4 text-lg text-muted-foreground">
				{locale === "ar"
					? "سوق السيارات الشامل في السودان"
					: "Sudan's comprehensive vehicle marketplace"}
			</p>

			{/* Debug: verify locale/dir wiring */}
			<div className="mt-8 rounded-lg border bg-card p-6">
				<dl className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<dt className="font-medium text-muted-foreground">Locale</dt>
						<dd className="font-mono">{locale}</dd>
					</div>
					<div>
						<dt className="font-medium text-muted-foreground">Direction</dt>
						<dd className="font-mono">{dir}</dd>
					</div>
					<div>
						<dt className="font-medium text-muted-foreground">t.common.search</dt>
						<dd>{t.common.search}</dd>
					</div>
					<div>
						<dt className="font-medium text-muted-foreground">t.common.cars</dt>
						<dd>{t.common.cars}</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
