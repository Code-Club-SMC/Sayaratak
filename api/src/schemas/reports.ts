import { z } from "zod";

export const createReportSchema = z.object({
	listingId: z.string().optional(),
	reason: z.string().min(1),
	description: z.string().optional(),
});

export const getReportsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(["pending", "resolved", "dismissed"]).optional(),
});

export const patchReportSchema = z.object({
	status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;
export type PatchReportInput = z.infer<typeof patchReportSchema>;
