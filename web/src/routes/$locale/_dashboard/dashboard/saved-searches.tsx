import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute(
	"/$locale/_dashboard/dashboard/saved-searches",
)({
	component: SavedSearchesPage,
});

function SavedSearchesPage() {
	const { t } = useTranslation();
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold capitalize">saved searches</h1>
			<p className="mt-2 text-muted-foreground">
				This page is under construction.
			</p>
		</div>
	);
}
