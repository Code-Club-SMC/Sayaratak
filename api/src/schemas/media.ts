import { z } from "zod";

export const mediaEntityTypeEnum = z.enum(["listing", "profile", "page"]);

export const signatureSchema = z.object({
	entityType: mediaEntityTypeEnum,
	entityId: z.string().min(1),
});

export const verifySchema = z.object({
	publicId: z.string().min(1),
	entityType: mediaEntityTypeEnum,
	entityId: z.string().min(1),
});

export type MediaEntityType = z.infer<typeof mediaEntityTypeEnum>;
export type SignatureInput = z.infer<typeof signatureSchema>;
export type VerifyMediaInput = z.infer<typeof verifySchema>;
