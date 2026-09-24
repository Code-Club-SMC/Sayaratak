import { z } from "zod";

export const listingMediaItemSchema = z.union([
	z.string(),
	z.object({
		url: z.string(),
		isPrimary: z.boolean().optional(),
	}),
]);

export const createListingSchema = z.object({
	categoryId: z.string().min(1),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	countryId: z.string().min(1),
	cityId: z.string().min(1),
	districtId: z.string().optional(),
	title: z.string().min(3),
	description: z.string().min(10),
	price: z.number().nonnegative(),
	currency: z.string().optional(),
	status: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
	year: z
		.number()
		.int()
		.min(1900)
		.max(new Date().getFullYear() + 1)
		.optional(),
	mileage: z.number().int().min(0).optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	specs: z.record(z.string(), z.any()).optional(),
	media: z.array(listingMediaItemSchema).optional(),
	rentalPeriod: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const patchStatusSchema = z.object({
	status: z.enum(["draft", "available", "reserved", "sold", "rented"]),
});

export const ownerListingStatusSchema = z.enum([
	"draft",
	"available",
	"reserved",
	"sold",
	"rented",
	"pending",
	"rejected",
	"banned",
]);

export const clickSchema = z.object({
	type: z.enum(["view", "phone", "whatsapp"]),
});

export const getListingsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	lat: z.coerce.number().min(-90).max(90).optional(),
	lng: z.coerce.number().min(-180).max(180).optional(),
	radius: z.coerce.number().positive().default(50),
	categoryId: z.string().optional(),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	userId: z.string().optional(),
	cityId: z.string().optional(),
	districtId: z.string().optional(),
	minPrice: z.coerce.number().nonnegative().optional(),
	maxPrice: z.coerce.number().nonnegative().optional(),
	minYear: z.coerce.number().int().optional(),
	maxYear: z.coerce.number().int().optional(),
	maxMileage: z.coerce.number().int().nonnegative().optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	q: z.string().trim().min(1).max(120).optional(),
	vehicleType: z.string().trim().min(1).max(80).optional(),
	sellerType: z
		.enum([
			"individual",
			"verified",
			"dealer",
			"dealership",
			"workshop",
			"mechanic",
		])
		.optional(),
	sort: z
		.enum(["newest", "price_asc", "price_desc", "mileage_asc"])
		.default("newest"),
	view: z.enum(["grid", "list"]).optional(),
	status: z.literal("available").optional(),
});

export const getMyListingsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: ownerListingStatusSchema.optional(),
});

export const getMapListingsQuerySchema = z.object({
	minLat: z.coerce.number().min(-90).max(90),
	minLng: z.coerce.number().min(-180).max(180),
	maxLat: z.coerce.number().min(-90).max(90),
	maxLng: z.coerce.number().min(-180).max(180),
	zoom: z.coerce.number().min(1).max(22).default(10),
	categoryId: z.string().optional(),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	minPrice: z.coerce.number().nonnegative().optional(),
	maxPrice: z.coerce.number().nonnegative().optional(),
	minYear: z.coerce.number().int().optional(),
	maxYear: z.coerce.number().int().optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type PatchListingStatusInput = z.infer<typeof patchStatusSchema>;
export type ListingClickInput = z.infer<typeof clickSchema>;
export type GetListingsQuery = z.infer<typeof getListingsQuerySchema>;
export type GetMyListingsQuery = z.infer<typeof getMyListingsQuerySchema>;
export type GetMapListingsQuery = z.infer<typeof getMapListingsQuerySchema>;
