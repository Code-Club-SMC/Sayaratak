import { z } from "zod";

export const getFavoritesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const listingIdParamSchema = z.object({
	listingId: z.string().min(1),
});

export type GetFavoritesQuery = z.infer<typeof getFavoritesQuerySchema>;
export type ListingIdParam = z.infer<typeof listingIdParamSchema>;
