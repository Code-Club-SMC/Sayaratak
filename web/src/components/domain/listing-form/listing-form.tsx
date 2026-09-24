import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { FormEvent, ReactElement } from "react";
import { cloneElement, isValidElement, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
	categoriesQueryOptions,
	citiesQueryOptions,
	countriesQueryOptions,
	districtsQueryOptions,
	localizedName,
	makesQueryOptions,
	modelsQueryOptions,
} from "@/lib/query-options/taxonomy";
import {
	type ListingFormValues,
	listingFormSchema,
} from "@/lib/schemas/listing-form";
import { cn } from "@/lib/utils";

type ListingFormProps = {
	locale: string;
	values: ListingFormValues;
	onChange: (next: ListingFormValues) => void;
	onSubmit: () => void;
	submitLabel: string;
	isSubmitting: boolean;
	error?: string;
	mode: "create" | "edit";
};

type FieldName = keyof ListingFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const transmissionOptions = ["automatic", "manual"];
const fuelOptions = ["petrol", "diesel", "hybrid", "electric"];
const conditionOptions = ["new", "used"];
const currencyOptions = ["SDG", "USD"];
const rentalPeriodOptions = ["daily", "weekly", "monthly"];

function optionLabel(value: string, locale: string): string {
	const labels: Record<string, { en: string; ar: string }> = {
		automatic: { en: "Automatic", ar: "أوتوماتيك" },
		manual: { en: "Manual", ar: "يدوي" },
		petrol: { en: "Petrol", ar: "بنزين" },
		diesel: { en: "Diesel", ar: "ديزل" },
		hybrid: { en: "Hybrid", ar: "هايبرد" },
		electric: { en: "Electric", ar: "كهربائي" },
		new: { en: "New", ar: "جديد" },
		used: { en: "Used", ar: "مستعمل" },
		daily: { en: "Daily", ar: "يومي" },
		weekly: { en: "Weekly", ar: "أسبوعي" },
		monthly: { en: "Monthly", ar: "شهري" },
	};

	const label = labels[value];
	return label ? (locale === "ar" ? label.ar : label.en) : value;
}

function firstError(errors: FieldErrors, name: FieldName): string | undefined {
	return errors[name];
}

export function ListingForm({
	locale,
	values,
	onChange,
	onSubmit,
	submitLabel,
	isSubmitting,
	error,
	mode,
}: ListingFormProps) {
	const [submitted, setSubmitted] = useState(false);
	const categoriesQuery = useQuery(categoriesQueryOptions(locale));
	const makesQuery = useQuery(makesQueryOptions(locale));
	const modelsQuery = useQuery(modelsQueryOptions(locale, values.makeId));
	const countriesQuery = useQuery(countriesQueryOptions(locale));
	const citiesQuery = useQuery(citiesQueryOptions(locale, values.countryId));
	const districtsQuery = useQuery(districtsQueryOptions(locale, values.cityId));

	const fieldErrors = useMemo<FieldErrors>(() => {
		if (!submitted) return {};

		const result = listingFormSchema.safeParse(values);
		if (result.success) return {};

		const flattened = result.error.flatten().fieldErrors;
		return Object.fromEntries(
			Object.entries(flattened).map(([key, messages]) => [key, messages?.[0]]),
		) as FieldErrors;
	}, [submitted, values]);

	function patch(patchValues: Partial<ListingFormValues>) {
		onChange({ ...values, ...patchValues });
	}

	function updateText(name: FieldName, value: string) {
		patch({ [name]: value } as Partial<ListingFormValues>);
	}

	function updateNumber(name: FieldName, value: string) {
		patch({
			[name]: value === "" ? undefined : Number(value),
		} as Partial<ListingFormValues>);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);

		const result = listingFormSchema.safeParse(values);
		if (!result.success) return;

		onSubmit();
	}

	const heading =
		mode === "create"
			? locale === "ar"
				? "إضافة إعلان"
				: "Create listing"
			: locale === "ar"
				? "تعديل الإعلان"
				: "Edit listing";

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-normal">{heading}</h1>
					<p className="text-sm text-muted-foreground">
						{locale === "ar"
							? "أدخل بيانات الإعلان الأساسية والمواصفات والموقع."
							: "Enter listing details, specifications, and location."}
					</p>
				</div>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<Loader2 className="animate-spin" />
					) : (
						<CheckCircle2 />
					)}
					{submitLabel}
				</Button>
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>
						{locale === "ar" ? "تعذر الحفظ" : "Save failed"}
					</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<section className="space-y-4">
				<SectionTitle
					title={locale === "ar" ? "نوع الإعلان" : "Listing type"}
					description={
						locale === "ar"
							? "اختر التصنيف وبيانات المركبة."
							: "Choose category and vehicle identity."
					}
				/>
				<div className="grid gap-4 md:grid-cols-3">
					<Field
						error={firstError(fieldErrors, "categoryId")}
						label={locale === "ar" ? "التصنيف" : "Category"}
					>
						<NativeSelect
							aria-invalid={Boolean(firstError(fieldErrors, "categoryId"))}
							className="w-full"
							value={values.categoryId}
							onChange={(event) => updateText("categoryId", event.target.value)}
						>
							<option value="">
								{locale === "ar" ? "اختر التصنيف" : "Select category"}
							</option>
							{categoriesQuery.data?.map((category) => (
								<option key={category.id} value={category.id}>
									{localizedName(category, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
					<Field label={locale === "ar" ? "الشركة" : "Make"}>
						<NativeSelect
							className="w-full"
							value={values.makeId ?? ""}
							onChange={(event) =>
								patch({ makeId: event.target.value, modelId: undefined })
							}
						>
							<option value="">
								{locale === "ar" ? "اختر الشركة" : "Select make"}
							</option>
							{makesQuery.data?.map((make) => (
								<option key={make.id} value={make.id}>
									{localizedName(make, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
					<Field label={locale === "ar" ? "الموديل" : "Model"}>
						<NativeSelect
							className="w-full"
							disabled={!values.makeId}
							value={values.modelId ?? ""}
							onChange={(event) => updateText("modelId", event.target.value)}
						>
							<option value="">
								{locale === "ar" ? "اختر الموديل" : "Select model"}
							</option>
							{modelsQuery.data?.map((model) => (
								<option key={model.id} value={model.id}>
									{localizedName(model, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
				</div>
			</section>

			<section className="space-y-4">
				<SectionTitle
					title={locale === "ar" ? "التفاصيل" : "Details"}
					description={
						locale === "ar"
							? "العنوان والسعر والحالة والمواصفات الأساسية."
							: "Title, price, condition, and core specifications."
					}
				/>
				<div className="grid gap-4 md:grid-cols-2">
					<Field
						error={firstError(fieldErrors, "title")}
						label={locale === "ar" ? "العنوان" : "Title"}
					>
						<Input
							aria-invalid={Boolean(firstError(fieldErrors, "title"))}
							value={values.title}
							onChange={(event) => updateText("title", event.target.value)}
						/>
					</Field>
					<div className="grid grid-cols-[1fr_120px] gap-3">
						<Field
							error={firstError(fieldErrors, "price")}
							label={locale === "ar" ? "السعر" : "Price"}
						>
							<Input
								aria-invalid={Boolean(firstError(fieldErrors, "price"))}
								min={0}
								type="number"
								value={values.price}
								onChange={(event) => updateNumber("price", event.target.value)}
							/>
						</Field>
						<Field label={locale === "ar" ? "العملة" : "Currency"}>
							<NativeSelect
								className="w-full"
								value={values.currency}
								onChange={(event) => updateText("currency", event.target.value)}
							>
								{currencyOptions.map((currency) => (
									<option key={currency} value={currency}>
										{currency}
									</option>
								))}
							</NativeSelect>
						</Field>
					</div>
				</div>
				<Field
					error={firstError(fieldErrors, "description")}
					label={locale === "ar" ? "الوصف" : "Description"}
				>
					<Textarea
						aria-invalid={Boolean(firstError(fieldErrors, "description"))}
						className="min-h-28"
						value={values.description}
						onChange={(event) => updateText("description", event.target.value)}
					/>
				</Field>
				<div className="grid gap-4 md:grid-cols-4">
					<Field label={locale === "ar" ? "السنة" : "Year"}>
						<Input
							min={1900}
							type="number"
							value={values.year ?? ""}
							onChange={(event) => updateNumber("year", event.target.value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "الممشى" : "Mileage"}>
						<Input
							min={0}
							type="number"
							value={values.mileage ?? ""}
							onChange={(event) => updateNumber("mileage", event.target.value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "القير" : "Transmission"}>
						<OptionSelect
							locale={locale}
							options={transmissionOptions}
							placeholder={locale === "ar" ? "اختر" : "Select"}
							value={values.transmission ?? ""}
							onChange={(value) => updateText("transmission", value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "الوقود" : "Fuel"}>
						<OptionSelect
							locale={locale}
							options={fuelOptions}
							placeholder={locale === "ar" ? "اختر" : "Select"}
							value={values.fuelType ?? ""}
							onChange={(value) => updateText("fuelType", value)}
						/>
					</Field>
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					<Field label={locale === "ar" ? "الحالة" : "Condition"}>
						<OptionSelect
							locale={locale}
							options={conditionOptions}
							placeholder={locale === "ar" ? "اختر" : "Select"}
							value={values.condition ?? ""}
							onChange={(value) => updateText("condition", value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "الفئة" : "Trim"}>
						<Input
							value={values.trim ?? ""}
							onChange={(event) => updateText("trim", event.target.value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "المحرك" : "Engine"}>
						<Input
							value={values.engineSize ?? ""}
							onChange={(event) => updateText("engineSize", event.target.value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "مدة الإيجار" : "Rental period"}>
						<OptionSelect
							locale={locale}
							options={rentalPeriodOptions}
							placeholder={locale === "ar" ? "غير محدد" : "None"}
							value={values.rentalPeriod ?? ""}
							onChange={(value) =>
								updateText(
									"rentalPeriod",
									value as ListingFormValues["rentalPeriod"],
								)
							}
						/>
					</Field>
				</div>
			</section>

			<section className="space-y-4">
				<SectionTitle
					title={locale === "ar" ? "الموقع" : "Location"}
					description={
						locale === "ar"
							? "اختر الدولة والمدينة والحي عند توفره."
							: "Select country, city, and district when available."
					}
				/>
				<div className="grid gap-4 md:grid-cols-3">
					<Field
						error={firstError(fieldErrors, "countryId")}
						label={locale === "ar" ? "الدولة" : "Country"}
					>
						<NativeSelect
							aria-invalid={Boolean(firstError(fieldErrors, "countryId"))}
							className="w-full"
							value={values.countryId}
							onChange={(event) =>
								patch({
									countryId: event.target.value,
									cityId: "",
									districtId: undefined,
								})
							}
						>
							<option value="">
								{locale === "ar" ? "اختر الدولة" : "Select country"}
							</option>
							{countriesQuery.data?.map((country) => (
								<option key={country.id} value={country.id}>
									{localizedName(country, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
					<Field
						error={firstError(fieldErrors, "cityId")}
						label={locale === "ar" ? "المدينة" : "City"}
					>
						<NativeSelect
							aria-invalid={Boolean(firstError(fieldErrors, "cityId"))}
							className="w-full"
							disabled={!values.countryId}
							value={values.cityId}
							onChange={(event) =>
								patch({ cityId: event.target.value, districtId: undefined })
							}
						>
							<option value="">
								{locale === "ar" ? "اختر المدينة" : "Select city"}
							</option>
							{citiesQuery.data?.map((city) => (
								<option key={city.id} value={city.id}>
									{localizedName(city, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
					<Field label={locale === "ar" ? "الحي" : "District"}>
						<NativeSelect
							className="w-full"
							disabled={!values.cityId}
							value={values.districtId ?? ""}
							onChange={(event) => updateText("districtId", event.target.value)}
						>
							<option value="">
								{locale === "ar" ? "غير محدد" : "No district"}
							</option>
							{districtsQuery.data?.map((district) => (
								<option key={district.id} value={district.id}>
									{localizedName(district, locale)}
								</option>
							))}
						</NativeSelect>
					</Field>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<Field label={locale === "ar" ? "خط العرض" : "Latitude"}>
						<Input
							max={90}
							min={-90}
							step="any"
							type="number"
							value={values.lat ?? ""}
							onChange={(event) => updateNumber("lat", event.target.value)}
						/>
					</Field>
					<Field label={locale === "ar" ? "خط الطول" : "Longitude"}>
						<Input
							max={180}
							min={-180}
							step="any"
							type="number"
							value={values.lng ?? ""}
							onChange={(event) => updateNumber("lng", event.target.value)}
						/>
					</Field>
				</div>
			</section>
		</form>
	);
}

function SectionTitle({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="border-b border-border pb-2">
			<h2 className="text-base font-semibold tracking-normal">{title}</h2>
			<p className="text-xs text-muted-foreground">{description}</p>
		</div>
	);
}

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactElement<{ id?: string }>;
}) {
	const id = useMemo(
		() => `listing-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
		[label],
	);
	const control = isValidElement(children)
		? cloneElement(children, { id })
		: children;

	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<div
				className={cn("[&_input]:w-full [&_select]:h-10 [&_select]:text-sm", {
					"[&_input]:border-destructive [&_select]:border-destructive": error,
				})}
			>
				{control}
			</div>
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}

function OptionSelect({
	locale,
	options,
	placeholder,
	value,
	onChange,
	id,
}: {
	locale: string;
	options: string[];
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	id?: string;
}) {
	return (
		<NativeSelect
			id={id}
			className="w-full"
			value={value}
			onChange={(event) => onChange(event.target.value)}
		>
			<option value="">{placeholder}</option>
			{options.map((option) => (
				<option key={option} value={option}>
					{optionLabel(option, locale)}
				</option>
			))}
		</NativeSelect>
	);
}
