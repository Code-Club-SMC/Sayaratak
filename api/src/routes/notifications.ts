import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { registerTokenSchema, idParamSchema } from "../schemas";
import { handleAppError } from "../lib/errors";
import { notificationsService } from "../services/notifications.service";

export const notificationsApp = new Hono<{ Variables: { user: SessionUser } }>();

notificationsApp.onError(handleAppError);
notificationsApp.use("/*", requireAuth());

// POST /api/notifications/token
// Register a device token for push notifications
notificationsApp.post("/token", zValidator("json", registerTokenSchema), async (c) => {
	const user = c.get("user");
	const res = await notificationsService.registerDeviceToken(user.id, c.req.valid("json"));
	return c.json(res.token, res.isNew ? 201 : 200);
});

// GET /api/notifications
// Fetch user's notification history
notificationsApp.get("/", async (c) => {
	const user = c.get("user");
	const notifs = await notificationsService.listNotifications(user.id);
	return c.json(notifs);
});

// PATCH /api/notifications/:id/read
// Mark notification as read
notificationsApp.patch("/:id/read", zValidator("param", idParamSchema), async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");
	const updated = await notificationsService.markNotificationRead(id, user.id);
	return c.json(updated);
});
