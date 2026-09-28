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
			nameEn: "Sudan " + uuid, nameAr: "السودان", code: "C_" + uuid.slice(0, 8)
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

	test("POST /: Start-with-message guards: 401 unauth, 404 listing not found, 400 self-message, 201 create, 200 append to existing", async () => {
		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, content: "Hi" }),
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
			body: JSON.stringify({ listingId: "00000000-0000-0000-0000-000000000000", content: "Hi" }),
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
			body: JSON.stringify({ listingId, content: "Hi" }),
		});
		expect(selfRes.status).toBe(400);

		// 4. Missing content -> 400 (validation)
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});
		const noContentRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId }),
		});
		expect(noContentRes.status).toBe(400);

		// 5. Buyer starts conversation with first message -> 201, one conversation + one message
		const createRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, content: "Is this still available?" }),
		});
		expect(createRes.status).toBe(201);
		const createData = await createRes.json() as {
			conversation: typeof conversations.$inferSelect;
			message: typeof messages.$inferSelect;
			isNewConversation: boolean;
		};
		expect(createData.isNewConversation).toBe(true);
		expect(createData.conversation.buyerId).toBe(buyerId);
		expect(createData.conversation.sellerId).toBe(sellerId);
		expect(createData.message.content).toBe("Is this still available?");
		expect(createData.message.senderId).toBe(buyerId);

		const messagesAfterCreate = await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, createData.conversation.id));
		expect(messagesAfterCreate.length).toBe(1);

		// 6. Same buyer messaging the same listing again -> 200, appends to the existing conversation
		const appendRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, content: "Following up" }),
		});
		expect(appendRes.status).toBe(200);
		const appendData = await appendRes.json() as {
			conversation: typeof conversations.$inferSelect;
			isNewConversation: boolean;
		};
		expect(appendData.isNewConversation).toBe(false);
		expect(appendData.conversation.id).toBe(createData.conversation.id);

		const messagesAfterAppend = await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, createData.conversation.id));
		expect(messagesAfterAppend.length).toBe(2);
	});

	test("POST /: retrying the same clientMessageId does not duplicate the message", async () => {
		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});

		const first = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, content: "Retry test", clientMessageId: "retry-1" }),
		});
		expect(first.status).toBe(201);
		const firstData = await first.json() as {
			conversation: { id: string };
			message: { id: string };
		};

		const retry = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, content: "Retry test", clientMessageId: "retry-1" }),
		});
		expect(retry.status).toBe(200); // existing conversation, not newly created
		const retryData = await retry.json() as { message: { id: string } };
		expect(retryData.message.id).toBe(firstData.message.id);

		const rows = await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, firstData.conversation.id));
		expect(rows.length).toBe(1);
	});

	test("POST /: rejects starting a NEW conversation on a non-available listing, but replies to an existing one still work after it closes", async () => {
		// A second, separate listing so this test doesn't collide with the shared `listingId` fixture.
		const uuid2 = crypto.randomUUID();
		const [country] = await db.insert(countries).values({
			nameEn: "Sudan2 " + uuid2, nameAr: "السودان", code: "C2_" + uuid2.slice(0, 8)
		}).returning();
		const [city] = await db.insert(cities).values({
			countryId: country.id, nameEn: "Khartoum2 " + uuid2, nameAr: "الخرطوم"
		}).returning();
		const [cat] = await db.insert(categories).values({
			nameEn: "Sedan " + uuid2, nameAr: "سيدان", slug: "sedan-" + uuid2
		}).returning();
		const [closedListing] = await db.insert(listings).values({
			userId: sellerId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Reserved car",
			description: "Already reserved",
			price: 20000,
			status: "reserved",
		}).returning();

		getSession.mockResolvedValue({
			session: { id: "s_buyer" },
			user: { id: buyerId, role: "user", accountType: "user" },
		});

		// New conversation on a closed listing -> 403 LISTING_NOT_CONTACTABLE
		const blockedRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId: closedListing.id, content: "Still available?" }),
		});
		expect(blockedRes.status).toBe(403);
		const blockedData = await blockedRes.json() as { code: string };
		expect(blockedData.code).toBe("LISTING_NOT_CONTACTABLE");

		// Start a conversation on this second listing while it's still available.
		await db.update(listings).set({ status: "available" }).where(eq(listings.id, closedListing.id));
		const startRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId: closedListing.id, content: "Hello" }),
		});
		expect(startRes.status).toBe(201);
		const startData = await startRes.json() as { conversation: { id: string } };

		// Close the listing, then confirm the EXISTING conversation still accepts replies.
		await db.update(listings).set({ status: "sold" }).where(eq(listings.id, closedListing.id));
		const replyRes = await chatApp.request(`/${startData.conversation.id}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "Still interested?" }),
		});
		expect(replyRes.status).toBe(201);

		// And a second message-start attempt for the same buyer+listing still just appends
		// (existing conversation), even though the listing is now closed.
		const secondStartRes = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId: closedListing.id, content: "One more thing" }),
		});
		expect(secondStartRes.status).toBe(200);
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
