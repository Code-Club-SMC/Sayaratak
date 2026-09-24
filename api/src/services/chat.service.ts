import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schemas/communication-schema";
import { listings } from "../db/schemas/listing-schema";
import { sendPushNotification } from "../lib/fcm";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors";

type BunServerWithPublish = {
	publish: (topic: string, data: string) => number;
};

export const chatService = {
	async listConversations(userId: string) {
		return db
			.select({
				id: conversations.id,
				listingId: conversations.listingId,
				buyerId: conversations.buyerId,
				sellerId: conversations.sellerId,
				lastMessageAt: conversations.lastMessageAt,
				createdAt: conversations.createdAt,
			})
			.from(conversations)
			.where(
				or(
					eq(conversations.buyerId, userId),
					eq(conversations.sellerId, userId),
				),
			)
			.orderBy(desc(conversations.lastMessageAt));
	},

	async startConversation(userId: string, listingId: string) {
		const [listing] = await db
			.select()
			.from(listings)
			.where(eq(listings.id, listingId));

		if (!listing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		if (listing.userId === userId) {
			throw new BadRequestError("Cannot message yourself", "CANNOT_MESSAGE_SELF");
		}

		const [existing] = await db
			.select()
			.from(conversations)
			.where(
				and(
					eq(conversations.listingId, listingId),
					eq(conversations.buyerId, userId),
				),
			);

		if (existing) {
			return {
				conversation: {
					id: existing.id,
					listingId: existing.listingId,
					buyerId: existing.buyerId,
					sellerId: existing.sellerId,
					lastMessageAt: existing.lastMessageAt,
					createdAt: existing.createdAt,
				},
				isNew: false,
			};
		}

		const [created] = await db
			.insert(conversations)
			.values({
				listingId,
				buyerId: userId,
				sellerId: listing.userId,
			})
			.returning();

		return {
			conversation: {
				id: created.id,
				listingId: created.listingId,
				buyerId: created.buyerId,
				sellerId: created.sellerId,
				lastMessageAt: created.lastMessageAt,
				createdAt: created.createdAt,
			},
			isNew: true,
		};
	},

	async getMessages(conversationId: string, userId: string) {
		const [conv] = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId));

		if (!conv) {
			throw new NotFoundError("Not found", "CONVERSATION_NOT_FOUND");
		}

		if (conv.buyerId !== userId && conv.sellerId !== userId) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		return db
			.select({
				id: messages.id,
				conversationId: messages.conversationId,
				senderId: messages.senderId,
				content: messages.content,
				isRead: messages.isRead,
				createdAt: messages.createdAt,
			})
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(messages.createdAt);
	},

	async sendMessage(conversationId: string, senderId: string, content: string, server?: any) {
		const [conv] = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId));

		if (!conv) {
			throw new NotFoundError("Not found", "CONVERSATION_NOT_FOUND");
		}

		if (conv.buyerId !== senderId && conv.sellerId !== senderId) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		const [msg] = await db
			.insert(messages)
			.values({
				conversationId,
				senderId,
				content,
			})
			.returning();

		const msgResponse = {
			id: msg.id,
			conversationId: msg.conversationId,
			senderId: msg.senderId,
			content: msg.content,
			isRead: msg.isRead,
			createdAt: msg.createdAt,
		};

		await db
			.update(conversations)
			.set({ lastMessageAt: new Date() })
			.where(eq(conversations.id, conversationId));

		const receiverId =
			conv.buyerId === senderId ? conv.sellerId : conv.buyerId;

		// Broadcast via WebSocket
		let deliveredViaWs = false;
		const wsServer = server as BunServerWithPublish | undefined;
		if (wsServer && typeof wsServer.publish === "function") {
			const recipientCount = wsServer.publish(
				`user_${receiverId}`,
				JSON.stringify({
					type: "chat_message",
					data: msgResponse,
				}),
			);
			if (typeof recipientCount === "number" && recipientCount > 0) {
				deliveredViaWs = true;
			}
		}

		// Fallback Push Notification if user is offline
		if (!deliveredViaWs) {
			await sendPushNotification(receiverId, "New Message", content, {
				type: "chat",
				conversationId,
			});
		}

		return msgResponse;
	},
};
