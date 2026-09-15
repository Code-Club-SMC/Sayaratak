import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { chatApp } = await import("../src/routes/chat");
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { listings } from "../src/db/schemas/listing-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { conversations, messages } from "../src/db/schemas/communication-schema";
import { eq } from "drizzle-orm";

describe("Chat & Messaging Endpoints", () => {
	let buyerId: string;
	let sellerId: string;
	let listingId: string;

	beforeEach(async () => {
		getSession.mockReset();

		const uuid = crypto.randomUUID();
		buyerId = "buyer_" + uuid;
		sellerId = "seller_" + uuid;

		await db.insert(user).values([
			{ id: buyerId, name: "Buyer User", email: `${buyerId}@example.com`, role: "user", accountType: "user" },
			{ id: sellerId, name: "Seller User", email: `${sellerId}@example.com`, role: "user", accountType: "user" },
		]);

		const [country] = await db.insert(countries).values({
			nameEn: "Sudan " + uuid, nameAr: "السودان", code: "C" + uuid.slice(0, 2).toUpperCase()
		}).returning();
		const [city] = await db.insert(cities).values({
			countryId: country.id, nameEn: "Khartoum " + uuid, nameAr: "الخرطوم"
		}).returning();
		const [cat] = await db.insert(categories).values({
			nameEn: "Coupe " + uuid, nameAr: "كوبيه", slug: "coupe-" + uuid
		}).returning();

		const [listing] = await db.insert(listings).values({
			userId: sellerId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Car for sale by seller",
			description: "Clean sedan with low mileage",
			price: 15000,
			status: "available",
		}).returning();

		listingId = listing.id;
	});

	test("POST /: Start conversation guards: 401 unauth, 404 listing not found, 400 self-message, 201 create", async () => {
		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId }),
		});
		expect(unauthRes.status).toBe(401);

		// 2. Listing not found -> 404
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});
		const notFoundRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId: "00000000-0000-0000-0000-000000000000" }),
		});
		expect(notFoundRes.status).toBe(404);

		// 3. Self-messaging blocked -> 400
		getSession.mockResolvedValue({
			session: { id: "s_seller" },
			user: { id: sellerId, role: "user", accountType: "user" },
		});
		const selfRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId }),
		});
		expect(selfRes.status).toBe(400);

		// 4. Buyer starts conversation -> 201
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});
		const createRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId }),
		});
		expect(createRes.status).toBe(201);
		const convData = await createRes.json() as typeof conversations.$inferSelect;
		expect(convData.buyerId).toBe(buyerId);
		expect(convData.sellerId).toBe(sellerId);

		// 5. Existing conversation lookup returns 200
		const getExistingRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId }),
		});
		expect(getExistingRes.status).toBe(200);
	});

	test("GET / and POST /:id/messages and GET /:id/messages full flow with participant auth", async () => {
		// Start conversation
		const [conv] = await db.insert(conversations).values({
			listingId,
			buyerId,
			sellerId,
		}).returning();

		// 1. Third party forbidden to view messages -> 403
		const thirdPartyId = "third_party_" + crypto.randomUUID();
		await db.insert(user).values({
			id: thirdPartyId, name: "Third Party", email: `${thirdPartyId}@e.com`, role: "user", accountType: "user"
		});

		getSession.mockResolvedValue({
			session: { id: "s_third" },
			user: { id: thirdPartyId, role: "user", accountType: "user" },
		});

		const forbiddenGet = await chatApp.request(`/${conv.id}/messages`);
		expect(forbiddenGet.status).toBe(403);

		const forbiddenPost = await chatApp.request(`/${conv.id}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "Intruder message" }),
		});
		expect(forbiddenPost.status).toBe(403);

		// 2. Buyer sends message -> 201
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});

		const sendRes = await chatApp.request(`/${conv.id}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "Hello! Is this car still available?" }),
		});
		expect(sendRes.status).toBe(201);
		const sentMsg = await sendRes.json() as typeof messages.$inferSelect;
		expect(sentMsg.content).toBe("Hello! Is this car still available?");
		expect(sentMsg.senderId).toBe(buyerId);

		// 3. Seller views messages -> 200
		getSession.mockResolvedValue({
			session: { id: "s_seller" },
			user: { id: sellerId, role: "user", accountType: "user" },
		});

		const getRes = await chatApp.request(`/${conv.id}/messages`);
		expect(getRes.status).toBe(200);
		const msgs = await getRes.json() as (typeof messages.$inferSelect)[];
		expect(msgs.length).toBe(1);
		expect(msgs[0].content).toBe("Hello! Is this car still available?");

		// 4. Buyer lists conversations -> 200
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});
		const listRes = await chatApp.request("/");
		expect(listRes.status).toBe(200);
		const convList = await listRes.json() as any[];
		expect(convList.some(c => c.id === conv.id)).toBe(true);
	});

	test("POST /:id/messages enforces per-user rate limiting (429)", async () => {
		const [conv] = await db.insert(conversations).values({
			listingId,
			buyerId,
			sellerId,
		}).returning();

		const rateLimitUserId = "rl_user_" + crypto.randomUUID();
		await db.insert(user).values({
			id: rateLimitUserId, name: "RL User", email: `${rateLimitUserId}@e.com`, role: "user", accountType: "user"
		});

		await db.update(conversations).set({ buyerId: rateLimitUserId }).where(eq(conversations.id, conv.id));

		getSession.mockResolvedValue({
			session: { id: "s_rl" },
			user: { id: rateLimitUserId, role: "user", accountType: "user" },
		});

		// Send 60 messages (limit)
		for (let i = 0; i < 60; i++) {
			const res = await chatApp.request(`/${conv.id}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: `Msg ${i}` }),
			});
			expect(res.status).toBe(201);
		}

		// 61st message hits rate limit
		const rateLimitedRes = await chatApp.request(`/${conv.id}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "Too fast!" }),
		});
		expect(rateLimitedRes.status).toBe(429);
		const errorData = await rateLimitedRes.json() as { error: string; code: string };
		expect(errorData.code).toBe("RATE_LIMIT_EXCEEDED");
	});
});
