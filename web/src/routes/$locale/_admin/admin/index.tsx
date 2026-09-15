import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_admin/admin/")({
	component: AdminDashboard,
});

function AdminDashboard() {
	const { t } = useTranslation();

	return (
		<div className="container mx-auto px-4 py-12">
			<h1 className="text-3xl font-bold">{t.admin.dashboard}</h1>
			<p className="mt-2 text-muted-foreground">
				{/* TODO: Phase 6 — Metrics cards, charts */}
				Admin metrics dashboard coming soon.
			</p>
		</div>
	);
}
