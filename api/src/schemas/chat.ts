import { z } from "zod";

export const startChatSchema = z.object({
	listingId: z.string().min(1, "listingId is required"),
});

export const sendMessageSchema = z.object({
	content: z.string().min(1, "content required"),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
