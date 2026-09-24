import { z } from "zod";

export const generateShareSchema = z.object({
	entityType: z.enum(["listing", "dealership", "workshop", "mechanic", "page"]),
	entityId: z.string().min(1),
	platform: z.enum(["whatsapp", "telegram", "facebook", "twitter", "tiktok", "copy_link", "general"]).optional(),
	locale: z.enum(["en", "ar"]).optional(),
});

export type GenerateShareInput = z.infer<typeof generateShareSchema>;
