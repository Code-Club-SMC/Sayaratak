import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { deviceTokens, notifications } from "../db/schemas/communication-schema";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import type { RegisterTokenInput } from "../schemas";

export const notificationsService = {
	async registerDeviceToken(userId: string, input: RegisterTokenInput) {
		const { fcmToken, deviceType } = input;

		const [existing] = await db
			.select()
			.from(deviceTokens)
			.where(eq(deviceTokens.fcmToken, fcmToken));

		if (existing) {
			const [updated] = await db
				.update(deviceTokens)
				.set({
					userId,
					deviceType,
					lastUsedAt: new Date(),
				})
				.where(eq(deviceTokens.id, existing.id))
				.returning();

			return {
				token: {
					id: updated.id,
					userId: updated.userId,
					deviceType: updated.deviceType,
					lastUsedAt: updated.lastUsedAt,
					createdAt: updated.createdAt,
					updatedAt: updated.updatedAt,
				},
				isNew: false,
			};
		}

		const [inserted] = await db
			.insert(deviceTokens)
			.values({
				userId,
				fcmToken,
				deviceType,
			})
			.returning();

		return {
			token: {
				id: inserted.id,
				userId: inserted.userId,
				deviceType: inserted.deviceType,
				lastUsedAt: inserted.lastUsedAt,
				createdAt: inserted.createdAt,
				updatedAt: inserted.updatedAt,
			},
			isNew: true,
		};
	},

	async listNotifications(userId: string) {
		return db
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
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(50);
	},

	async markNotificationRead(id: string, userId: string) {
		const [existing] = await db
			.select({ id: notifications.id, userId: notifications.userId })
			.from(notifications)
			.where(eq(notifications.id, id));

		if (!existing) {
			throw new NotFoundError("Not found", "NOTIFICATION_NOT_FOUND");
		}

		if (existing.userId !== userId) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		const [updated] = await db
			.update(notifications)
			.set({ isRead: true })
			.where(eq(notifications.id, id))
			.returning();

		return {
			id: updated.id,
			userId: updated.userId,
			title: updated.title,
			body: updated.body,
			type: updated.type,
			referenceId: updated.referenceId,
			isRead: updated.isRead,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		};
	},
};
