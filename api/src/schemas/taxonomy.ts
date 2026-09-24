import { z } from "zod";

export const makeIdParamSchema = z.object({
	makeId: z.string().min(1),
});

export const getModelsQuerySchema = z.object({
	makeId: z.string().optional(),
	vehicleType: z.string().optional(),
});

export const createCategorySchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	iconUrl: z.string().optional(),
	displayOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createMakeSchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	logoUrl: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const updateMakeSchema = createMakeSchema.partial();

export const createModelSchema = z.object({
	makeId: z.string().min(1, "makeId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	vehicleType: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const updateModelSchema = createModelSchema.partial();

export type GetModelsQuery = z.infer<typeof getModelsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMakeInput = z.infer<typeof createMakeSchema>;
export type UpdateMakeInput = z.infer<typeof updateMakeSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
