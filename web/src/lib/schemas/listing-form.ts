import { z } from "zod";
import type {
	ListingDetail,
	ListingLifecycleStatus,
	ListingMediaInput,
	ListingMutationPayload,
	ListingStatus,
} from "@/lib/query-options/listings";

const editableListingStatuses = [
	"draft",
	"available",
	"reserved",
	"sold",
	"rented",
] as const;

const optionalNumber = (schema: z.ZodNumber) =>
	z.preprocess(
		(value) => (value === "" || value === null ? undefined : value),
		schema.optional(),
	);

export const listingStatusSchema = z.enum(editableListingStatuses);

export const listingFormSchema = z.object({
	categoryId: z.string().min(1),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	countryId: z.string().min(1),
	cityId: z.string().min(1),
	districtId: z.string().optional(),
	title: z.string().trim().min(3),
	description: z.string().trim().min(10),
	price: z.coerce.number().nonnegative(),
	currency: z.string().default("SDG"),
	status: listingStatusSchema.default("draft"),
	lat: optionalNumber(z.coerce.number().min(-90).max(90)),
	lng: optionalNumber(z.coerce.number().min(-180).max(180)),
	year: optionalNumber(
		z.coerce
			.number()
			.int()
			.min(1900)
			.max(new Date().getFullYear() + 1),
	),
	mileage: optionalNumber(z.coerce.number().int().min(0)),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	trim: z.string().optional(),
	engineSize: z.string().optional(),
	exteriorColor: z.string().optional(),
	interiorColor: z.string().optional(),
	media: z
		.array(
			z.union([
				z.string(),
				z.object({
					url: z.string().url(),
					publicId: z.string().optional(),
					isPrimary: z.boolean().optional(),
				}),
			]),
		)
		.default([]),
	rentalPeriod: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

export const defaultListingFormValues: ListingFormValues = {
	categoryId: "",
	countryId: "",
	cityId: "",
	title: "",
	description: "",
	price: 0,
	currency: "SDG",
	status: "draft",
	media: [],
};

function emptyToUndefined(value: string | undefined): string | undefined {
	return value && value.trim().length > 0 ? value.trim() : undefined;
}

function isEditableStatus(
	status: ListingLifecycleStatus,
): status is ListingStatus {
	return editableListingStatuses.includes(status as ListingStatus);
}

export function toListingMutationPayload(
	values: ListingFormValues,
	status: ListingStatus = values.status,
): ListingMutationPayload {
	const specs: Record<string, unknown> = {};

	for (const [key, value] of Object.entries({
		trim: values.trim,
		engineSize: values.engineSize,
		exteriorColor: values.exteriorColor,
		interiorColor: values.interiorColor,
	})) {
		if (typeof value === "string" && value.trim().length > 0) {
			specs[key] = value.trim();
		}
	}

	return {
		categoryId: values.categoryId,
		makeId: emptyToUndefined(values.makeId),
		modelId: emptyToUndefined(values.modelId),
		countryId: values.countryId,
		cityId: values.cityId,
		districtId: emptyToUndefined(values.districtId),
		title: values.title.trim(),
		description: values.description.trim(),
		price: values.price,
		currency: values.currency || "SDG",
		status,
		lat: values.lat,
		lng: values.lng,
		year: values.year,
		mileage: values.mileage,
		transmission: emptyToUndefined(values.transmission),
		fuelType: emptyToUndefined(values.fuelType),
		condition: emptyToUndefined(values.condition),
		specs,
		media: values.media as ListingMediaInput[],
		rentalPeriod: values.rentalPeriod,
	};
}

export function fromListingDetail(listing: ListingDetail): ListingFormValues {
	const status = isEditableStatus(listing.status) ? listing.status : "draft";

	return {
		...defaultListingFormValues,
		categoryId: listing.categoryId ?? "",
		makeId: listing.makeId,
		modelId: listing.modelId,
		countryId: listing.countryId ?? "",
		cityId: listing.cityId ?? "",
		districtId: listing.districtId,
		title: listing.title,
		description: listing.description ?? "",
		price: listing.price,
		currency: listing.currency ?? "SDG",
		status,
		lat: listing.lat,
		lng: listing.lng,
		year: listing.year,
		mileage: listing.mileage,
		transmission: listing.transmission,
		fuelType: listing.fuelType,
		condition: listing.condition,
		trim:
			typeof listing.specs?.trim === "string" ? listing.specs.trim : undefined,
		engineSize:
			typeof listing.specs?.engineSize === "string"
				? listing.specs.engineSize
				: undefined,
		exteriorColor:
			typeof listing.specs?.exteriorColor === "string"
				? listing.specs.exteriorColor
				: undefined,
		interiorColor:
			typeof listing.specs?.interiorColor === "string"
				? listing.specs.interiorColor
				: undefined,
		media: Array.isArray(listing.media)
			? listing.media.map((item) => ({
					url: item.url,
					publicId: item.publicId,
					isPrimary: item.isPrimary,
				}))
			: [],
		rentalPeriod: listing.rentalPeriod,
	};
}
