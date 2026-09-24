import { z } from "zod";

export const registerTokenSchema = z.object({
	fcmToken: z.string().min(1, "fcmToken is required"),
	deviceType: z.enum(["ios", "android", "web"]),
});

export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
