import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ListingFormValues } from "@/lib/schemas/listing-form";

type ReviewPanelProps = {
	values: ListingFormValues;
	onBack: () => void;
	onPublish: () => void;
	isPublishing: boolean;
	error?: string;
	locale?: string;
};

function formatPrice(value: number, currency: string): string {
	return `${currency} ${value.toLocaleString()}`;
}

function displayValue(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim().length > 0
		? value
		: fallback;
}

export function ReviewPanel({
	values,
	onBack,
	onPublish,
	isPublishing,
	error,
	locale = "en",
}: ReviewPanelProps) {
	const fallback = locale === "ar" ? "غير محدد" : "Not set";
	const mediaCount = values.media.length;
	const specs = [
		[locale === "ar" ? "السنة" : "Year", values.year],
		[locale === "ar" ? "الممشى" : "Mileage", values.mileage],
		[locale === "ar" ? "القير" : "Transmission", values.transmission],
		[locale === "ar" ? "الوقود" : "Fuel", values.fuelType],
		[locale === "ar" ? "الحالة" : "Condition", values.condition],
		[locale === "ar" ? "الفئة" : "Trim", values.trim],
	].filter(([, value]) => value !== undefined && value !== "");

	return (
		<section className="space-y-5">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-normal">
						{locale === "ar" ? "مراجعة الإعلان" : "Review listing"}
					</h1>
					<p className="text-sm text-muted-foreground">
						{locale === "ar"
							? "راجع البيانات قبل النشر في السوق."
							: "Confirm details before publishing to the marketplace."}
					</p>
				</div>
				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={onBack}>
						<ArrowLeft />
						{locale === "ar" ? "رجوع" : "Back"}
					</Button>
					<Button type="button" disabled={isPublishing} onClick={onPublish}>
						{isPublishing ? <Loader2 className="animate-spin" /> : <Send />}
						{locale === "ar" ? "نشر الإعلان" : "Publish"}
					</Button>
				</div>
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>
						{locale === "ar" ? "تعذر النشر" : "Publish failed"}
					</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="space-y-4">
					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "العنوان" : "Title"}
						</div>
						<div className="mt-1 text-lg font-semibold tracking-normal">
							{displayValue(values.title, fallback)}
						</div>
					</div>

					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "الوصف" : "Description"}
						</div>
						<p className="mt-1 whitespace-pre-wrap text-sm leading-6">
							{displayValue(values.description, fallback)}
						</p>
					</div>

					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "المواصفات" : "Specifications"}
						</div>
						<div className="mt-3 grid gap-2 sm:grid-cols-2">
							{specs.length > 0 ? (
								specs.map(([label, value]) => (
									<div
										key={String(label)}
										className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
									>
										<span className="text-muted-foreground">{label}</span>
										<span className="font-medium">{String(value)}</span>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground">{fallback}</p>
							)}
						</div>
					</div>
				</div>

				<aside className="space-y-4">
					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "السعر" : "Price"}
						</div>
						<div className="mt-1 text-xl font-semibold tracking-normal">
							{formatPrice(values.price, values.currency)}
						</div>
					</div>

					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "الموقع" : "Location"}
						</div>
						<div className="mt-2 space-y-1 text-sm">
							<div>
								{locale === "ar" ? "الدولة" : "Country"}:{" "}
								{displayValue(values.countryId, fallback)}
							</div>
							<div>
								{locale === "ar" ? "المدينة" : "City"}:{" "}
								{displayValue(values.cityId, fallback)}
							</div>
							<div>
								{locale === "ar" ? "الحي" : "District"}:{" "}
								{displayValue(values.districtId, fallback)}
							</div>
						</div>
					</div>

					<div className="rounded-md border border-border p-4">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							{locale === "ar" ? "الصور" : "Photos"}
						</div>
						<div className="mt-1 text-sm font-medium">
							{mediaCount} {locale === "ar" ? "صورة" : "photo(s)"}
						</div>
					</div>
				</aside>
			</div>
		</section>
	);
}
