import { z } from "zod";

export const getCitiesQuerySchema = z.object({
	countryId: z.string().optional(),
});

export const getDistrictsQuerySchema = z.object({
	cityId: z.string().optional(),
});

export const createCountrySchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	code: z.string().min(2, "code is required"),
	currencyCode: z.string().optional(),
	phoneCode: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const updateCountrySchema = createCountrySchema.partial();

export const createCitySchema = z.object({
	countryId: z.string().min(1, "countryId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	isActive: z.boolean().optional(),
});

export const updateCitySchema = createCitySchema.partial();

export const createDistrictSchema = z.object({
	cityId: z.string().min(1, "cityId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	isActive: z.boolean().optional(),
});

export const updateDistrictSchema = createDistrictSchema.partial();

export type GetCitiesQuery = z.infer<typeof getCitiesQuerySchema>;
export type GetDistrictsQuery = z.infer<typeof getDistrictsQuerySchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type CreateDistrictInput = z.infer<typeof createDistrictSchema>;
export type UpdateDistrictInput = z.infer<typeof updateDistrictSchema>;
