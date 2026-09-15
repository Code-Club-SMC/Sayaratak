import { Hono } from "hono";
import { eq, or, and, desc } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schemas/communication-schema";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";
import { sendPushNotification } from "../lib/fcm";
import { upgradeWebSocket } from "../lib/ws";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createUserRateLimiter } from "../lib/rate-limiter";

export const chatApp = new Hono<{ Variables: { user: any } }>();

// §6: Per-user rate limiting for sending chat messages (60 msgs/min)
const chatMessageRateLimiter = createUserRateLimiter(60);

const startChatSchema = z.object({
	listingId: z.string().min(1, "listingId is required"),
});

const sendMessageSchema = z.object({
	content: z.string().min(1, "content required"),
});

// GET /api/chat/ws
// Upgrades the connection to a WebSocket
chatApp.get("/ws", async (c, next) => {
	// Custom auth check since standard middleware doesn't work well with WS upgrades in all clients
	const cookieHeader = c.req.header("cookie");
	const authHeader = c.req.header("authorization");
	
	let userId = null;
	if (cookieHeader || authHeader) {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session) userId = session.user.id;
	}

	if (!userId) {
		return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
	}

	return upgradeWebSocket((c) => ({
		onMessage(event, ws) {
			// For ping/pong if needed
		},
		onOpen(event, ws) {
			const rawWs = ws.raw as any;
			if (rawWs && rawWs.subscribe) {
				rawWs.subscribe(`user_${userId}`);
			}
		},
		onClose(event, ws) {
			const rawWs = ws.raw as any;
			if (rawWs && rawWs.unsubscribe) {
				rawWs.unsubscribe(`user_${userId}`);
			}
		},
	}))(c, next);
});

// GET /api/chat
// List conversations
chatApp.get("/", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const convs = await db.select({
		id: conversations.id,
		listingId: conversations.listingId,
		buyerId: conversations.buyerId,
		sellerId: conversations.sellerId,
		lastMessageAt: conversations.lastMessageAt,
		createdAt: conversations.createdAt,
	}).from(conversations)
		.where(or(
			eq(conversations.buyerId, session.user.id),
			eq(conversations.sellerId, session.user.id)
		))
		.orderBy(desc(conversations.lastMessageAt));

	return c.json(convs);
});

// POST /api/chat
// Start or get a conversation
chatApp.post("/", zValidator("json", startChatSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { listingId } = c.req.valid("json");

	const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
	if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);

	if (listing.userId === session.user.id) {
		return c.json({ error: "Cannot message yourself", code: "CANNOT_MESSAGE_SELF" }, 400);
	}

	const [existing] = await db.select().from(conversations).where(
		and(
			eq(conversations.listingId, listingId),
			eq(conversations.buyerId, session.user.id)
		)
	);

	if (existing) return c.json({
		id: existing.id,
		listingId: existing.listingId,
		buyerId: existing.buyerId,
		sellerId: existing.sellerId,
		lastMessageAt: existing.lastMessageAt,
		createdAt: existing.createdAt,
	});

	const [created] = await db.insert(conversations).values({
		listingId,
		buyerId: session.user.id,
		sellerId: listing.userId,
	}).returning();

	return c.json({
		id: created.id,
		listingId: created.listingId,
		buyerId: created.buyerId,
		sellerId: created.sellerId,
		lastMessageAt: created.lastMessageAt,
		createdAt: created.createdAt,
	}, 201);
});

// GET /api/chat/:id/messages
chatApp.get("/:id/messages", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
	if (!conv) return c.json({ error: "Not found", code: "CONVERSATION_NOT_FOUND" }, 404);

	if (conv.buyerId !== session.user.id && conv.sellerId !== session.user.id) {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const msgs = await db.select({
		id: messages.id,
		conversationId: messages.conversationId,
		senderId: messages.senderId,
		content: messages.content,
		isRead: messages.isRead,
		createdAt: messages.createdAt,
	}).from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
	return c.json(msgs);
});

// POST /api/chat/:id/messages
chatApp.post("/:id/messages", zValidator("json", sendMessageSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	if (!chatMessageRateLimiter.check(session.user.id)) {
		return c.json({ error: "Too Many Requests. Message rate limit exceeded.", code: "RATE_LIMIT_EXCEEDED" }, 429);
	}

	const id = c.req.param("id");
	const { content } = c.req.valid("json");

	const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
	if (!conv) return c.json({ error: "Not found", code: "CONVERSATION_NOT_FOUND" }, 404);

	if (conv.buyerId !== session.user.id && conv.sellerId !== session.user.id) {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const [msg] = await db.insert(messages).values({
		conversationId: id,
		senderId: session.user.id,
		content,
	}).returning();

	const msgResponse = {
		id: msg.id,
		conversationId: msg.conversationId,
		senderId: msg.senderId,
		content: msg.content,
		isRead: msg.isRead,
		createdAt: msg.createdAt,
	};

	await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, id));

	const receiverId = conv.buyerId === session.user.id ? conv.sellerId : conv.buyerId;

	// Broadcast via WebSocket
	const server = (c.env as any)?.server || (globalThis as any).server;
	let deliveredViaWs = false;
	if (server && typeof server.publish === "function") {
		const recipientCount = server.publish(`user_${receiverId}`, JSON.stringify({
			type: "chat_message",
			data: msgResponse
		}));
		if (typeof recipientCount === "number" && recipientCount > 0) {
			deliveredViaWs = true;
		}
	}

	// Fallback Push Notification if user is offline / not on active WebSocket
	if (!deliveredViaWs) {
		await sendPushNotification(receiverId, "New Message", content, {
			type: "chat",
			conversationId: id,
		});
	}

	return c.json(msgResponse, 201);
});
