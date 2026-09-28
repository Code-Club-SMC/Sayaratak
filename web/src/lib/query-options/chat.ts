import { queryOptions } from "@tanstack/react-query";
import { apiGet } from "../api";

export function conversationsQueryOptions() {
	return queryOptions({
		queryKey: ["conversations"],
		queryFn: async () => {
			const data = await apiGet("/api/chat");
			return data as {
				id: string;
				listingId: string;
				buyerId: string;
				sellerId: string;
				lastMessageAt: string;
				createdAt: string;
			}[];
		},
	});
}

export function conversationMessagesQueryOptions(conversationId: string) {
	return queryOptions({
		queryKey: ["conversations", conversationId, "messages"],
		queryFn: async () => {
			const data = await apiGet(`/api/chat/${conversationId}/messages`);
			return data as {
				id: string;
				conversationId: string;
				senderId: string;
				content: string;
				isRead: boolean;
				createdAt: string;
			}[];
		},
		enabled: !!conversationId,
	});
}
