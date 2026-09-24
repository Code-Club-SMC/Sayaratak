import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/reviews")({
	component: ReviewsPage,
});

function ReviewsPage() {
	const { t } = useTranslation();
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold capitalize">reviews</h1>
			<p className="mt-2 text-muted-foreground">
				This page is under construction.
			</p>
		</div>
	);
}
