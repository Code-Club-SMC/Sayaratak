import { and, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import { conversations, messages } from "../db/schemas/communication-schema";
import { listings } from "../db/schemas/listing-schema";
import { user } from "../db/schemas/auth-schema";
import { sendPushNotification } from "../lib/fcm";
import { sendNewMessageEmail } from "../lib/mailer";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors";

type BunServerWithPublish = {
	publish: (topic: string, data: string) => number;
};

const buyerUser = alias(user, "buyer_user");
const sellerUser = alias(user, "seller_user");

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertMessageIdempotent(
	executor: Executor,
	conversationId: string,
	senderId: string,
	content: string,
	clientMessageId?: string,
) {
	if (!clientMessageId) {
		const [inserted] = await executor
			.insert(messages)
			.values({ conversationId, senderId, content })
			.returning();
		return inserted;
	}

	const [inserted] = await executor
		.insert(messages)
		.values({ conversationId, senderId, content, clientMessageId })
		.onConflictDoNothing({
			target: [messages.conversationId, messages.clientMessageId],
			where: sql`${messages.clientMessageId} IS NOT NULL`,
		})
		.returning();

	if (inserted) return inserted;

	const [existing] = await executor
		.select()
		.from(messages)
		.where(
			and(
				eq(messages.conversationId, conversationId),
				eq(messages.clientMessageId, clientMessageId),
			),
		);
	return existing;
}

function safeMessage(msg: typeof messages.$inferSelect) {
	return {
		id: msg.id,
		conversationId: msg.conversationId,
		senderId: msg.senderId,
		content: msg.content,
		isRead: msg.isRead,
		createdAt: msg.createdAt,
	};
}

function safeConversation(conv: typeof conversations.$inferSelect) {
	return {
		id: conv.id,
		listingId: conv.listingId,
		buyerId: conv.buyerId,
		sellerId: conv.sellerId,
		lastMessageAt: conv.lastMessageAt,
		createdAt: conv.createdAt,
	};
}

/**
 * Delivers a new-message notification: WebSocket broadcast first, push
 * notification as a fallback only when the WebSocket delivery didn't reach
 * anyone (receiver is offline), and email always (a persistent channel the
 * receiver checks regardless of live delivery) — skipped in tests so the
 * suite never triggers real SMTP sends.
 */
async function notifyNewMessage(
	receiverId: string,
	senderId: string,
	content: string,
	conversationId: string,
	msgResponse: ReturnType<typeof safeMessage>,
	server?: unknown,
) {
	let deliveredViaWs = false;
	const wsServer = server as BunServerWithPublish | undefined;
	if (wsServer && typeof wsServer.publish === "function") {
		const recipientCount = wsServer.publish(
			`user_${receiverId}`,
			JSON.stringify({ type: "chat_message", data: msgResponse }),
		);
		if (typeof recipientCount === "number" && recipientCount > 0) {
			deliveredViaWs = true;
		}
	}

	if (!deliveredViaWs) {
		await sendPushNotification(receiverId, "New Message", content, {
			type: "chat",
			conversationId,
		});
	}

	if (process.env.NODE_ENV !== "test") {
		const [sender, receiver] = await Promise.all([
			db.select({ name: user.name }).from(user).where(eq(user.id, senderId)).then((r) => r[0]),
			db.select({ email: user.email }).from(user).where(eq(user.id, receiverId)).then((r) => r[0]),
		]);

		if (receiver?.email) {
			sendNewMessageEmail({
				email: receiver.email,
				senderName: sender?.name || "A user",
				content,
				url: `${process.env.VITE_APP_URL || "https://sayaratak.com"}/en/dashboard/messages`,
			}).catch(() => {});
		}
	}
}

export const chatService = {
	async listConversations(userId: string, page = 1, limit = 20) {
		const offset = (page - 1) * limit;
		const whereClause = or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId));

		const rows = await db
			.select({
				id: conversations.id,
				listingId: conversations.listingId,
				buyerId: conversations.buyerId,
				sellerId: conversations.sellerId,
				lastMessageAt: conversations.lastMessageAt,
				createdAt: conversations.createdAt,
				listingTitle: listings.title,
				listingStatus: listings.status,
				listingPrice: listings.price,
				listingCurrency: listings.currency,
				listingMedia: listings.media,
				buyerName: buyerUser.name,
				buyerImage: buyerUser.image,
				sellerName: sellerUser.name,
				sellerImage: sellerUser.image,
				unreadCount: sql<number>`(
					select count(*)::int from ${messages}
					where ${messages.conversationId} = ${conversations.id}
						and ${messages.senderId} != ${userId}
						and ${messages.isRead} = false
				)`,
			})
			.from(conversations)
			.leftJoin(listings, eq(conversations.listingId, listings.id))
			.leftJoin(buyerUser, eq(conversations.buyerId, buyerUser.id))
			.leftJoin(sellerUser, eq(conversations.sellerId, sellerUser.id))
			.where(whereClause)
			.orderBy(desc(conversations.lastMessageAt))
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(conversations)
			.where(whereClause);

		return {
			items: rows.map((row) => {
				const media = Array.isArray(row.listingMedia) ? row.listingMedia : [];
				const primary = media.find((m: any) => m?.isPrimary) ?? media[0];
				return {
					id: row.id,
					listingId: row.listingId,
					lastMessageAt: row.lastMessageAt,
					createdAt: row.createdAt,
					unreadCount: Number(row.unreadCount),
					listing: row.listingTitle
						? {
								id: row.listingId,
								title: row.listingTitle,
								status: row.listingStatus,
								price: row.listingPrice,
								currency: row.listingCurrency,
								primaryImage:
									primary && typeof primary === "object" ? primary.url : (primary ?? null),
							}
						: null,
					participant:
						row.buyerId === userId
							? { id: row.sellerId, name: row.sellerName, image: row.sellerImage }
							: { id: row.buyerId, name: row.buyerName, image: row.buyerImage },
				};
			}),
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},

	async startConversationWithMessage(
		userId: string,
		listingId: string,
		content: string,
		clientMessageId?: string,
		server?: unknown,
	) {
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

		const [existingConversation] = await db
			.select()
			.from(conversations)
			.where(
				and(eq(conversations.listingId, listingId), eq(conversations.buyerId, userId)),
			);

		if (!existingConversation && listing.status !== "available") {
			throw new ForbiddenError(
				"This listing is closed and cannot start a new conversation.",
				"LISTING_NOT_CONTACTABLE",
			);
		}

		const result = await db.transaction(async (tx) => {
			let conversation = existingConversation;

			if (!conversation) {
				const [inserted] = await tx
					.insert(conversations)
					.values({ listingId, buyerId: userId, sellerId: listing.userId })
					.onConflictDoNothing({
						target: [conversations.listingId, conversations.buyerId],
					})
					.returning();

				conversation = inserted;
				if (!conversation) {
					[conversation] = await tx
						.select()
						.from(conversations)
						.where(
							and(
								eq(conversations.listingId, listingId),
								eq(conversations.buyerId, userId),
							),
						);
				}
			}

			const message = await insertMessageIdempotent(
				tx,
				conversation.id,
				userId,
				content,
				clientMessageId,
			);

			await tx
				.update(conversations)
				.set({ lastMessageAt: new Date() })
				.where(eq(conversations.id, conversation.id));

			return {
				conversation: safeConversation(conversation),
				message: safeMessage(message),
				isNewConversation: !existingConversation,
			};
		});

		// The starter is always the buyer (self-messaging is blocked above), so
		// the seller is always the recipient of a new inquiry.
		await notifyNewMessage(
			result.conversation.sellerId,
			userId,
			content,
			result.conversation.id,
			result.message,
			server,
		);

		return result;
	},

	async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
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

		await db
			.update(messages)
			.set({ isRead: true })
			.where(
				and(
					eq(messages.conversationId, conversationId),
					sql`${messages.senderId} != ${userId}`,
					eq(messages.isRead, false),
				),
			);

		const offset = (page - 1) * limit;
		const items = await db
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
			.orderBy(desc(messages.createdAt))
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(messages)
			.where(eq(messages.conversationId, conversationId));

		return {
			items: items.reverse(),
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},

	async sendMessage(
		conversationId: string,
		senderId: string,
		content: string,
		clientMessageId: string | undefined,
		server?: any,
	) {
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

		const msg = await db.transaction(async (tx) => {
			const inserted = await insertMessageIdempotent(
				tx,
				conversationId,
				senderId,
				content,
				clientMessageId,
			);
			await tx
				.update(conversations)
				.set({ lastMessageAt: new Date() })
				.where(eq(conversations.id, conversationId));
			return inserted;
		});

		const msgResponse = safeMessage(msg);

		const receiverId =
			conv.buyerId === senderId ? conv.sellerId : conv.buyerId;

		await notifyNewMessage(receiverId, senderId, content, conversationId, msgResponse, server);

		return msgResponse;
	},
};
