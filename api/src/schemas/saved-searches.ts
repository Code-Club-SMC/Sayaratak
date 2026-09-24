import { z } from "zod";

export const createSavedSearchSchema = z.object({
	title: z.string().min(1, "Title is required"),
	filters: z.record(z.string(), z.any()),
});

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
