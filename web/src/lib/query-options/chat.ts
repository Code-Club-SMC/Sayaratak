import { queryOptions } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { chatKeys } from "@/lib/query-keys";

export type ConversationSummary = {
	id: string;
	listingId: string;
	lastMessageAt: string;
	createdAt: string;
	unreadCount: number;
	listing: {
		id: string;
		title: string;
		status: string;
		price: number;
		currency: string;
		primaryImage: string | null;
	} | null;
	participant: { id: string; name: string | null; image: string | null };
};

export type ConversationsResponse = {
	items: ConversationSummary[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	isRead: boolean;
	createdAt: string;
};

export type MessagesResponse = {
	items: ChatMessage[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export function conversationsQueryOptions(
	locale: string,
	page = 1,
	limit = 20,
) {
	return queryOptions({
		queryKey: chatKeys.conversations(locale, page),
		queryFn: () =>
			apiGet<ConversationsResponse>("/api/v1/chat", {
				locale,
				params: { page, limit },
			}),
		staleTime: 10 * 1000,
	});
}

export function conversationMessagesQueryOptions(
	locale: string,
	conversationId: string,
	page = 1,
	limit = 30,
) {
	return queryOptions({
		queryKey: chatKeys.messages(locale, conversationId, page),
		queryFn: () =>
			apiGet<MessagesResponse>(`/api/v1/chat/${conversationId}/messages`, {
				locale,
				params: { page, limit },
			}),
		staleTime: 5 * 1000,
	});
}

export const startConversation = (
	locale: string,
	payload: { listingId: string; content: string; clientMessageId?: string },
) =>
	apiPost<{
		conversation: { id: string };
		message: ChatMessage;
		isNewConversation: boolean;
	}>("/api/v1/chat", payload, { locale });

export const sendMessage = (
	locale: string,
	conversationId: string,
	payload: { content: string; clientMessageId?: string },
) =>
	apiPost<ChatMessage>(`/api/v1/chat/${conversationId}/messages`, payload, {
		locale,
	});
