import { z } from "zod";

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const idParamSchema = z.object({
	id: z.string().min(1),
});

export const uuidParamSchema = z.object({
	id: z.string().uuid(),
});

export const slugParamSchema = z.object({
	slug: z.string().min(1),
});

export const codeParamSchema = z.object({
	code: z.string().min(1),
});

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const localeSchema = z.enum(["en", "ar"]);

export type IdParam = z.infer<typeof idParamSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type CodeParam = z.infer<typeof codeParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
