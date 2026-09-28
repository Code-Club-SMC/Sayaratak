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

export const chatPaginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatPaginationQuery = z.infer<typeof chatPaginationQuerySchema>;
