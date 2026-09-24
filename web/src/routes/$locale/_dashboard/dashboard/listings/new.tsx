import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus } from "lucide-react";
import { useState } from "react";
import { ListingForm } from "@/components/domain/listing-form/listing-form";
import { MediaUploader } from "@/components/domain/listing-form/media-uploader";
import { ReviewPanel } from "@/components/domain/listing-form/review-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";
import { listingKeys } from "@/lib/query-keys";
import {
	createListing,
	updateListing,
	updateListingStatus,
} from "@/lib/query-options/listings";
import {
	defaultListingFormValues,
	type ListingFormValues,
	toListingMutationPayload,
} from "@/lib/schemas/listing-form";

export const Route = createFileRoute(
	"/$locale/_dashboard/dashboard/listings/new",
)({
	component: CreateListingPage,
});

type CreateStep = "details" | "media" | "review" | "success";

function errorMessage(error: unknown): string {
	if (error instanceof ApiRequestError) return error.message;
	if (error instanceof Error) return error.message;
	return "Request failed";
}

function CreateListingPage() {
	const { locale } = Route.useParams();
	const queryClient = useQueryClient();
	const [step, setStep] = useState<CreateStep>("details");
	const [values, setValues] = useState<ListingFormValues>(
		defaultListingFormValues,
	);
	const [draftId, setDraftId] = useState<string | null>(null);
	const [error, setError] = useState<string>();
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [isSavingMedia, setIsSavingMedia] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);

	async function invalidateListingQueries(listingId?: string) {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: listingKeys.lists(locale) }),
			queryClient.invalidateQueries({
				queryKey: listingKeys.managementLists(locale),
			}),
			listingId
				? queryClient.invalidateQueries({
						queryKey: listingKeys.detail(locale, listingId),
					})
				: Promise.resolve(),
		]);
	}

	async function saveDraft() {
		setIsSavingDraft(true);
		setError(undefined);

		try {
			if (draftId) {
				await updateListing(
					locale,
					draftId,
					toListingMutationPayload(values, "draft"),
				);
				await invalidateListingQueries(draftId);
				setStep("media");
				return;
			}

			const draft = await createListing(
				locale,
				toListingMutationPayload(values, "draft"),
			);
			setDraftId(draft.id);
			await invalidateListingQueries(draft.id);
			setStep("media");
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsSavingDraft(false);
		}
	}

	async function saveMediaAndReview() {
		if (!draftId) {
			setError(
				locale === "ar"
					? "يجب إنشاء المسودة قبل رفع الصور."
					: "Draft must be created before media upload.",
			);
			return;
		}

		setIsSavingMedia(true);
		setError(undefined);

		try {
			await updateListing(locale, draftId, { media: values.media });
			await invalidateListingQueries(draftId);
			setStep("review");
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsSavingMedia(false);
		}
	}

	async function publishListing() {
		if (!draftId) {
			setError(
				locale === "ar"
					? "يجب إنشاء المسودة قبل النشر."
					: "Draft must be created before publishing.",
			);
			return;
		}

		setIsPublishing(true);
		setError(undefined);

		try {
			await updateListing(locale, draftId, { media: values.media });
			await updateListingStatus(locale, draftId, "available");
			await invalidateListingQueries(draftId);
			setStep("success");
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsPublishing(false);
		}
	}

	if (step === "success" && draftId) {
		return (
			<div className="mx-auto max-w-2xl space-y-5 py-10">
				<div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
					<CheckCircle2 className="size-6" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-normal">
						{locale === "ar" ? "تم نشر الإعلان" : "Listing published"}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{locale === "ar"
							? "أصبح إعلانك متاحاً في السوق."
							: "Your listing is now available in the marketplace."}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild>
						<Link to="/$locale/listings/$id" params={{ locale, id: draftId }}>
							{locale === "ar" ? "عرض الإعلان" : "View listing"}
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/$locale/dashboard/listings" params={{ locale }}>
							{locale === "ar" ? "إعلاناتي" : "My Listings"}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<StepIndicator locale={locale} step={step} />

			{step === "details" ? (
				<ListingForm
					locale={locale}
					values={values}
					onChange={setValues}
					onSubmit={() => void saveDraft()}
					submitLabel={
						locale === "ar"
							? "حفظ المسودة والمتابعة"
							: "Save draft and continue"
					}
					isSubmitting={isSavingDraft}
					error={error}
					mode="create"
				/>
			) : null}

			{step === "media" ? (
				<div className="space-y-5">
					<MediaUploader
						listingId={draftId ?? ""}
						value={values.media}
						onChange={(media) =>
							setValues((current) => ({ ...current, media }))
						}
						disabled={!draftId || isSavingMedia}
						locale={locale}
					/>

					{error ? (
						<Alert variant="destructive">
							<AlertTitle>
								{locale === "ar" ? "تعذر حفظ الصور" : "Media save failed"}
							</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<div className="flex justify-between gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep("details")}
						>
							{locale === "ar" ? "رجوع" : "Back"}
						</Button>
						<Button
							type="button"
							disabled={isSavingMedia}
							onClick={() => void saveMediaAndReview()}
						>
							<ImagePlus />
							{locale === "ar" ? "مراجعة الإعلان" : "Review listing"}
						</Button>
					</div>
				</div>
			) : null}

			{step === "review" ? (
				<ReviewPanel
					values={values}
					onBack={() => setStep("media")}
					onPublish={() => void publishListing()}
					isPublishing={isPublishing}
					error={error}
					locale={locale}
				/>
			) : null}
		</div>
	);
}

function StepIndicator({ locale, step }: { locale: string; step: CreateStep }) {
	const steps = [
		{ id: "details", labelEn: "Details", labelAr: "التفاصيل" },
		{ id: "media", labelEn: "Media", labelAr: "الصور" },
		{ id: "review", labelEn: "Review", labelAr: "المراجعة" },
	] as const;

	return (
		<div className="grid gap-2 sm:grid-cols-3">
			{steps.map((item) => {
				const active = item.id === step;
				const label = locale === "ar" ? item.labelAr : item.labelEn;

				return (
					<div
						key={item.id}
						className={
							active
								? "rounded-md border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary"
								: "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
						}
					>
						{label}
					</div>
				);
			})}
		</div>
	);
}
