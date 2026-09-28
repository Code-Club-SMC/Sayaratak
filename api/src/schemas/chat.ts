import { z } from "zod";

export const startChatSchema = z.object({
	listingId: z.string().min(1, "listingId is required"),
	content: z.string().min(1, "content required"),
	clientMessageId: z.string().min(1).max(100).optional(),
});

export const sendMessageSchema = z.object({
	content: z.string().min(1, "content required"),
	clientMessageId: z.string().min(1).max(100).optional(),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
