import { z } from "zod";

export const profileTypeEnum = z.enum(["dealership", "workshop", "mechanic"]);

export const profileTypeParamSchema = z.object({
	type: profileTypeEnum,
});

export const mapProfileQuerySchema = z.object({
	minLat: z.coerce.number().min(-90).max(90),
	minLng: z.coerce.number().min(-180).max(180),
	maxLat: z.coerce.number().min(-90).max(90),
	maxLng: z.coerce.number().min(-180).max(180),
	zoom: z.coerce.number().min(1).max(22).default(10),
});

export const patchProfileSchema = z.object({
	name: z.string().min(1).optional(),
	nameEn: z.string().min(1).optional(),
	nameAr: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	bio: z.string().optional().nullable(),
	bioAr: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	whatsapp: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	addressAr: z.string().optional().nullable(),
	cityId: z.string().optional().nullable(),
	districtId: z.string().optional().nullable(),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	logoUrl: z.string().optional().nullable(),
	coverUrl: z.string().optional().nullable(),
	profilePicUrl: z.string().optional().nullable(),
	yearsExperience: z.number().int().nonnegative().optional().nullable(),
	specialization: z.string().optional().nullable(),
	workingHours: z.record(z.string(), z.any()).optional().nullable(),
	images: z.array(z.string()).optional(),
	portfolioImages: z.array(z.string()).optional(),
});

export type ProfileType = z.infer<typeof profileTypeEnum>;
export type ProfileTypeParam = z.infer<typeof profileTypeParamSchema>;
export type MapProfileQuery = z.infer<typeof mapProfileQuerySchema>;
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;
