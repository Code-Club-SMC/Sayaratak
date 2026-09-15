import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/")({
	component: DashboardHome,
});

function DashboardHome() {
	const { t } = useTranslation();

	return (
		<div className="container mx-auto px-4 py-12">
			<h1 className="text-3xl font-bold">{t.common.dashboard}</h1>
			<p className="mt-2 text-muted-foreground">
				{/* TODO: Phase 3 — Quick stats, recent activity */}
				Dashboard overview coming soon.
			</p>
		</div>
	);
}
