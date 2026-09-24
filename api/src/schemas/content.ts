import { z } from "zod";
import { slugRegex } from "./common";

export const pageSlugParamSchema = z.object({
	slug: z.string().regex(slugRegex, "Invalid slug format"),
});

export type PageSlugParam = z.infer<typeof pageSlugParamSchema>;
