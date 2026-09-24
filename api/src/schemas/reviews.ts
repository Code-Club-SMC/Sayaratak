import { z } from "zod";

export const createReviewSchema = z
	.object({
		dealershipId: z.string().optional(),
		workshopId: z.string().optional(),
		mechanicId: z.string().optional(),
		rating: z.number().int().min(1).max(5),
		comment: z.string().max(1000).optional(),
	})
	.refine(
		(data) => Boolean(data.dealershipId || data.workshopId || data.mechanicId),
		{
			message: "Target ID (dealership, workshop, or mechanic) is required",
		}
	);

export const patchReplySchema = z.object({
	reply: z.string().min(1).max(1000),
});

export const getReviewsQuerySchema = z.object({
	dealershipId: z.string().optional(),
	workshopId: z.string().optional(),
	mechanicId: z.string().optional(),
	userId: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type PatchReplyInput = z.infer<typeof patchReplySchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
