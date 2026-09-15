import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { deviceTokens, notifications } from "../db/schemas/communication-schema";
import { auth } from "../../lib/auth";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const notificationsApp = new Hono<{ Variables: { user: any } }>();

const registerTokenSchema = z.object({
	fcmToken: z.string().min(1, "fcmToken is required"),
	deviceType: z.enum(["ios", "android", "web"]),
});

// POST /api/notifications/token
// Register a device token for push notifications
notificationsApp.post("/token", zValidator("json", registerTokenSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { fcmToken, deviceType } = c.req.valid("json");

	// Upsert token
	const [existing] = await db.select().from(deviceTokens).where(eq(deviceTokens.fcmToken, fcmToken));
	
	if (existing) {
		const [updated] = await db.update(deviceTokens).set({
			userId: session.user.id,
			deviceType,
			lastUsedAt: new Date(),
		}).where(eq(deviceTokens.id, existing.id)).returning();
		return c.json({
			id: updated.id,
			userId: updated.userId,
			deviceType: updated.deviceType,
			lastUsedAt: updated.lastUsedAt,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		});
	} else {
		const [inserted] = await db.insert(deviceTokens).values({
			userId: session.user.id,
			fcmToken,
			deviceType,
		}).returning();
		return c.json({
			id: inserted.id,
			userId: inserted.userId,
			deviceType: inserted.deviceType,
			lastUsedAt: inserted.lastUsedAt,
			createdAt: inserted.createdAt,
			updatedAt: inserted.updatedAt,
		}, 201);
	}
});

// GET /api/notifications
// Fetch user's notification history
notificationsApp.get("/", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const notifs = await db
		.select({
			id: notifications.id,
			userId: notifications.userId,
			title: notifications.title,
			body: notifications.body,
			type: notifications.type,
			referenceId: notifications.referenceId,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
			updatedAt: notifications.updatedAt,
		})
		.from(notifications)
		.where(eq(notifications.userId, session.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(50);

	return c.json(notifs);
});

// PATCH /api/notifications/:id/read
// Mark notification as read
notificationsApp.patch("/:id/read", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");

	const [existing] = await db.select({ id: notifications.id, userId: notifications.userId }).from(notifications).where(eq(notifications.id, id));
	if (!existing) return c.json({ error: "Not found", code: "NOTIFICATION_NOT_FOUND" }, 404);
	if (existing.userId !== session.user.id) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const [updated] = await db.update(notifications)
		.set({ isRead: true })
		.where(eq(notifications.id, id))
		.returning();

	return c.json({
		id: updated.id,
		userId: updated.userId,
		title: updated.title,
		body: updated.body,
		type: updated.type,
		referenceId: updated.referenceId,
		isRead: updated.isRead,
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	});
});
