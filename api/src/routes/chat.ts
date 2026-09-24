import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { auth } from "../../lib/auth";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { createUserRateLimiter } from "../lib/rate-limiter";
import { upgradeWebSocket } from "../lib/ws";
import { handleAppError, RateLimitError, UnauthorizedError } from "../lib/errors";
import { chatService } from "../services/chat.service";
import {
	startChatSchema,
	sendMessageSchema,
	idParamSchema,
} from "../schemas";

export const chatApp = new Hono<{ Variables: { user: SessionUser } }>();

chatApp.onError(handleAppError);

// §6: Per-user rate limiting for sending chat messages (60 msgs/min)
const chatMessageRateLimiter = createUserRateLimiter(60);

// GET /api/chat/ws
// Upgrades the connection to a WebSocket
chatApp.get("/ws", async (c, next) => {
	const cookieHeader = c.req.header("cookie");
	const authHeader = c.req.header("authorization");

	let userId = null;
	if (cookieHeader || authHeader) {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session) userId = session.user.id;
	}

	if (!userId) {
		throw new UnauthorizedError("Unauthorized", "UNAUTHORIZED");
	}

	return upgradeWebSocket(() => ({
		onOpen(event, ws) {
			const rawWs = ws.raw as { subscribe?: (topic: string) => void } | undefined;
			if (rawWs && typeof rawWs.subscribe === "function") {
				rawWs.subscribe(`user_${userId}`);
			}
		},
		onClose(event, ws) {
			const rawWs = ws.raw as { unsubscribe?: (topic: string) => void } | undefined;
			if (rawWs && typeof rawWs.unsubscribe === "function") {
				rawWs.unsubscribe(`user_${userId}`);
			}
		},
	}))(c, next);
});

// GET /api/chat
// List conversations
chatApp.get("/", requireAuth(), async (c) => {
	const user = c.get("user");
	const convs = await chatService.listConversations(user.id);
	return c.json(convs);
});

// POST /api/chat
// Start or get a conversation
chatApp.post("/", requireAuth(), zValidator("json", startChatSchema), async (c) => {
	const user = c.get("user");
	const { listingId } = c.req.valid("json");
	const { conversation, isNew } = await chatService.startConversation(user.id, listingId);
	return c.json(conversation, isNew ? 201 : 200);
});

// GET /api/chat/:id/messages
chatApp.get("/:id/messages", requireAuth(), zValidator("param", idParamSchema), async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");
	const msgs = await chatService.getMessages(id, user.id);
	return c.json(msgs);
});

// POST /api/chat/:id/messages
chatApp.post(
	"/:id/messages",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", sendMessageSchema),
	async (c) => {
		const user = c.get("user");

		if (!chatMessageRateLimiter.check(user.id)) {
			throw new RateLimitError(
				"Too Many Requests. Message rate limit exceeded.",
				"RATE_LIMIT_EXCEEDED",
			);
		}

		const { id } = c.req.valid("param");
		const { content } = c.req.valid("json");

		const server =
			(c.env as Record<string, unknown> | undefined)?.server ||
			(globalThis as Record<string, unknown>).server;

		const msgResponse = await chatService.sendMessage(id, user.id, content, server);
		return c.json(msgResponse, 201);
	},
);
