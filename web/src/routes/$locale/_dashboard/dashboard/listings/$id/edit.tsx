import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Eye, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingForm } from "@/components/domain/listing-form/listing-form";
import { MediaUploader } from "@/components/domain/listing-form/media-uploader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api";
import { listingKeys } from "@/lib/query-keys";
import {
	type ListingLifecycleStatus,
	type ListingMutationPayload,
	type ListingStatus,
	managedListingDetailQueryOptions,
	updateListing,
} from "@/lib/query-options/listings";
import {
	defaultListingFormValues,
	fromListingDetail,
	type ListingFormValues,
	toListingMutationPayload,
} from "@/lib/schemas/listing-form";

export const Route = createFileRoute(
	"/$locale/_dashboard/dashboard/listings/$id/edit",
)({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			managedListingDetailQueryOptions(params.locale, params.id),
		),
	component: EditListingPage,
});

const ownerEditableStatuses = [
	"draft",
	"available",
	"reserved",
	"sold",
	"rented",
] as const satisfies readonly ListingStatus[];

function isOwnerEditableStatus(
	status: ListingLifecycleStatus | undefined,
): status is ListingStatus {
	return ownerEditableStatuses.includes(status as ListingStatus);
}

function errorMessage(error: unknown): string {
	if (error instanceof ApiRequestError) return error.message;
	if (error instanceof Error) return error.message;
	return "Request failed";
}

function mutationPayloadForCurrentStatus(
	values: ListingFormValues,
	currentStatus: ListingLifecycleStatus | undefined,
): Partial<ListingMutationPayload> {
	const payload: Partial<ListingMutationPayload> = toListingMutationPayload(
		values,
		values.status,
	);

	if (!isOwnerEditableStatus(currentStatus)) {
		delete payload.status;
	}

	return payload;
}

function EditListingPage() {
	const { locale, id } = Route.useParams();
	const queryClient = useQueryClient();
	const {
		data: listing,
		isLoading,
		error: loadError,
	} = useQuery(managedListingDetailQueryOptions(locale, id));
	const [values, setValues] = useState<ListingFormValues>(
		defaultListingFormValues,
	);
	const [initializedListingId, setInitializedListingId] = useState<
		string | null
	>(null);
	const [saveError, setSaveError] = useState<string>();
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!listing || initializedListingId === listing.id) return;

		setValues(fromListingDetail(listing));
		setInitializedListingId(listing.id);
		setSaveError(undefined);
		setSavedAt(null);
	}, [initializedListingId, listing]);

	async function invalidateListingQueries() {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: listingKeys.managedDetail(locale, id),
			}),
			queryClient.invalidateQueries({
				queryKey: listingKeys.managementLists(locale),
			}),
			queryClient.invalidateQueries({
				queryKey: listingKeys.detail(locale, id),
			}),
			queryClient.invalidateQueries({ queryKey: listingKeys.lists(locale) }),
		]);
	}

	async function saveListing() {
		if (!listing) return;

		setIsSaving(true);
		setSaveError(undefined);

		try {
			await updateListing(
				locale,
				id,
				mutationPayloadForCurrentStatus(values, listing.status),
			);
			await invalidateListingQueries();
			setSavedAt(new Date());
		} catch (requestError) {
			setSaveError(errorMessage(requestError));
		} finally {
			setIsSaving(false);
		}
	}

	if (isLoading || !listing) {
		return <EditListingSkeleton />;
	}

	if (loadError) {
		return (
			<div className="mx-auto max-w-3xl space-y-4 py-8">
				<Alert variant="destructive">
					<AlertTriangle />
					<AlertTitle>
						{locale === "ar" ? "تعذر تحميل الإعلان" : "Listing load failed"}
					</AlertTitle>
					<AlertDescription>{errorMessage(loadError)}</AlertDescription>
				</Alert>
				<Button variant="outline" asChild>
					<Link to="/$locale/dashboard/listings" params={{ locale }}>
						<ArrowLeft />
						{locale === "ar" ? "العودة إلى إعلاناتي" : "Back to listings"}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/$locale/dashboard/listings" params={{ locale }}>
							<ArrowLeft />
							{locale === "ar" ? "إعلاناتي" : "My Listings"}
						</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">{listing.status}</Badge>
						<span className="text-xs text-muted-foreground">{listing.id}</span>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" asChild>
						<Link to="/$locale/listings/$id" params={{ locale, id }}>
							<Eye />
							{locale === "ar" ? "عرض الإعلان" : "View"}
						</Link>
					</Button>
					<Button
						type="button"
						disabled={isSaving}
						onClick={() => void saveListing()}
					>
						<Save />
						{locale === "ar" ? "حفظ" : "Save"}
					</Button>
				</div>
			</div>

			{savedAt ? (
				<Alert>
					<Save />
					<AlertTitle>
						{locale === "ar" ? "تم حفظ التغييرات" : "Changes saved"}
					</AlertTitle>
					<AlertDescription>
						{locale === "ar"
							? "تم تحديث بيانات الإعلان والصور."
							: `Listing and media updated at ${savedAt.toLocaleTimeString()}.`}
					</AlertDescription>
				</Alert>
			) : null}

			<ListingForm
				locale={locale}
				values={values}
				onChange={setValues}
				onSubmit={() => void saveListing()}
				submitLabel={locale === "ar" ? "حفظ التغييرات" : "Save changes"}
				isSubmitting={isSaving}
				error={saveError}
				mode="edit"
			/>

			<MediaUploader
				listingId={id}
				value={values.media}
				onChange={(media) => setValues((current) => ({ ...current, media }))}
				disabled={isSaving}
				locale={locale}
			/>
		</div>
	);
}

function EditListingSkeleton() {
	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<div className="flex justify-between gap-4">
				<div className="space-y-2">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-5 w-48" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-20" />
					<Skeleton className="h-10 w-24" />
				</div>
			</div>
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-96 w-full" />
		</div>
	);
}
