import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { notificationsApp } = await import("../src/routes/notifications");
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { deviceTokens, notifications } from "../src/db/schemas/communication-schema";
import { eq } from "drizzle-orm";

describe("Notifications Endpoints", () => {
	let userId: string;
	let otherUserId: string;

	beforeEach(async () => {
		getSession.mockReset();

		const uuid = crypto.randomUUID();
		userId = "u_notif_" + uuid;
		otherUserId = "u_other_" + uuid;

		await db.insert(user).values([
			{ id: userId, name: "Notif User", email: `${userId}@example.com`, role: "user", accountType: "user" },
			{ id: otherUserId, name: "Other User", email: `${otherUserId}@example.com`, role: "user", accountType: "user" },
		]);
	});

	test("POST /token registers or updates FCM device token", async () => {
		const token = "token_" + crypto.randomUUID();

		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthRes = await notificationsApp.request("/token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fcmToken: token, deviceType: "android" }),
		});
		expect(unauthRes.status).toBe(401);

		// 2. Missing fields -> 400
		getSession.mockResolvedValue({
			session: { id: "s_user" },
			user: { id: userId, role: "user", accountType: "user" },
		});
		const badRes = await notificationsApp.request("/token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ deviceType: "android" }),
		});
		expect(badRes.status).toBe(400);

		// 3. First insert -> 201
		const insertRes = await notificationsApp.request("/token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fcmToken: token, deviceType: "android" }),
		});
		expect(insertRes.status).toBe(201);
		const insertedToken = await insertRes.json() as typeof deviceTokens.$inferSelect;
		expect(insertedToken.userId).toBe(userId);
		expect(insertedToken.deviceType).toBe("android");

		// 4. Update existing token -> 200
		const updateRes = await notificationsApp.request("/token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fcmToken: token, deviceType: "ios" }),
		});
		expect(updateRes.status).toBe(200);
		const updatedToken = await updateRes.json() as typeof deviceTokens.$inferSelect;
		expect(updatedToken.deviceType).toBe("ios");
	});

	test("GET / and PATCH /:id/read handles notification lifecycle and ownership", async () => {
		// Create notification for userId
		const [notif] = await db.insert(notifications).values({
			userId,
			title: "Special Offer",
			body: "Discount on sedan listings",
			type: "system",
			isRead: false,
		}).returning();

		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthGet = await notificationsApp.request("/");
		expect(unauthGet.status).toBe(401);

		// 2. User gets notifications -> 200
		getSession.mockResolvedValue({
			session: { id: "s_user" },
			user: { id: userId, role: "user", accountType: "user" },
		});
		const getRes = await notificationsApp.request("/");
		expect(getRes.status).toBe(200);
		const notifList = await getRes.json() as (typeof notifications.$inferSelect)[];
		expect(notifList.some(n => n.id === notif.id)).toBe(true);

		// 3. Other user forbidden to mark as read -> 403
		getSession.mockResolvedValue({
			session: { id: "s_other" },
			user: { id: otherUserId, role: "user", accountType: "user" },
		});
		const forbiddenPatch = await notificationsApp.request(`/${notif.id}/read`, {
			method: "PATCH",
		});
		expect(forbiddenPatch.status).toBe(403);

		// 4. Non-existent notification -> 404
		getSession.mockResolvedValue({
			session: { id: "s_user" },
			user: { id: userId, role: "user", accountType: "user" },
		});
		const notFoundPatch = await notificationsApp.request(`/00000000-0000-0000-0000-000000000000/read`, {
			method: "PATCH",
		});
		expect(notFoundPatch.status).toBe(404);

		// 5. Owner marks notification as read -> 200
		const readRes = await notificationsApp.request(`/${notif.id}/read`, {
			method: "PATCH",
		});
		expect(readRes.status).toBe(200);
		const updatedNotif = await readRes.json() as typeof notifications.$inferSelect;
		expect(updatedNotif.isRead).toBe(true);
	});
});
