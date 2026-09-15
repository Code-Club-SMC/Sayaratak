import { describe, test, expect, mock, beforeEach } from "bun:test";
import { eq } from "drizzle-orm";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

import { favoritesApp } from "../src/routes/favorites";
import { reviewsApp } from "../src/routes/reviews";
import { reportsApp } from "../src/routes/reports";
import { listingsApp } from "../src/routes/listings";
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { dealerships, workshops, mechanics } from "../src/db/schemas/profile-schema";
import { listings } from "../src/db/schemas/listing-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { favorites, reviews, reports } from "../src/db/schemas/social-schema";

describe("Social & Moderation Endpoints (Favorites, Reviews, Reports)", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	let listingId = "";
	let dealershipId = "";

	test("Setup - mock data", async () => {
		const uuid = crypto.randomUUID();
		await db.insert(user).values({
			id: "u1_" + uuid, name: "User 1", email: `u1_${uuid}@e.com`, role: "user", accountType: "user"
		}).onConflictDoNothing();
		
		await db.insert(user).values({
			id: "u_admin_" + uuid, name: "Admin", email: `admin_${uuid}@e.com`, role: "admin", accountType: "user"
		}).onConflictDoNothing();

		await db.insert(user).values({
			id: "u_dealer_" + uuid, name: "Dealer", email: `dealer_${uuid}@e.com`, role: "user", accountType: "dealership"
		}).onConflictDoNothing();

		const [cat] = await db.insert(categories).values({ slug: "c1_" + uuid, nameEn: "C1", nameAr: "c1" }).returning();
		const [country] = await db.insert(countries).values({ code: "SD_" + uuid, nameEn: "SD", nameAr: "SD" }).returning();
		const [city] = await db.insert(cities).values({ countryId: country.id, nameEn: "City", nameAr: "City" }).returning();
		
		const [listing] = await db.insert(listings).values({
			userId: "u1_" + uuid, categoryId: cat.id, countryId: country.id, cityId: city.id,
			title: "Listing", description: "Desc", price: 100
		}).returning();
		listingId = listing.id;

		const [dealer] = await db.insert(dealerships).values({
			userId: "u_dealer_" + uuid, name: "Best Dealership"
		}).returning();
		dealershipId = dealer.id;
	});

	// --- FAVORITES ---
	test("POST /favorites/:listingId creates favorite", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await favoritesApp.request(`/${listingId}`, { method: "POST" });
		expect(res.status).toBe(201);

		const [l] = await db.select().from(listings).where(eq(listings.id, listingId));
		expect(l.favoriteCount).toBe(1);
	});

	test("POST /favorites/:listingId prevents duplicates", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await favoritesApp.request(`/${listingId}`, { method: "POST" });
		expect(res.status).toBe(409);
	});

	test("GET /favorites fetches list", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await favoritesApp.request("/");
		expect(res.status).toBe(200);
		const favs = await res.json() as (typeof favorites.$inferSelect)[];
		expect(favs.length).toBeGreaterThan(0);
	});

	test("DELETE /favorites/:listingId removes favorite", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await favoritesApp.request(`/${listingId}`, { method: "DELETE" });
		expect(res.status).toBe(200);

		const [l] = await db.select().from(listings).where(eq(listings.id, listingId));
		expect(l.favoriteCount).toBe(0);
	});

	// --- REVIEWS ---
	test("POST /reviews leaves a review and updates average", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await reviewsApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dealershipId, rating: 5, comment: "Great" })
		});
		expect(res.status).toBe(201);
		
		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, dealershipId));
		expect(dealer.ratingAvg).toBe(5);
		expect(dealer.ratingCount).toBe(1);
	});

	test("PATCH /reviews/:id/reply allows owner to reply", async () => {
		const getRes = await reviewsApp.request(`/?dealershipId=${dealershipId}`);
		const reviewsData = await getRes.json() as { review: typeof reviews.$inferSelect }[];
		const reviewId = reviewsData[0].review.id;

		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, dealershipId));
		getSession.mockResolvedValue({ session: { id: "s_dealer" }, user: { id: dealer.userId, role: "user" } });
		
		const res = await reviewsApp.request(`/${reviewId}/reply`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ reply: "Thanks!" })
		});
		expect(res.status).toBe(200);
		const updated = await res.json() as typeof reviews.$inferSelect;
		expect(updated.reply).toBe("Thanks!");
	});

	// --- REPORTS ---
	test("POST /reports creates a report", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await reportsApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId, reason: "Scam" })
		});
		expect(res.status).toBe(201);
	});

	test("GET /reports restricts to admin", async () => {
		const [usr] = await db.select().from(user).where(eq(user.name, "User 1")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: usr.id, role: "user" } });
		const res = await reportsApp.request("/");
		expect(res.status).toBe(403);
	});

	test("PATCH /reports/:id allows admin to resolve", async () => {
		const [admin] = await db.select().from(user).where(eq(user.name, "Admin")).limit(1);
		getSession.mockResolvedValue({ session: { id: "s_admin" }, user: { id: admin.id, role: "admin" } });
		const getRes = await reportsApp.request("/");
		const reportsData = await getRes.json() as { report: typeof reports.$inferSelect }[];
		const reportId = reportsData[0].report.id;

		const res = await reportsApp.request(`/${reportId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "resolved" })
		});
		expect(res.status).toBe(200);
		const updated = await res.json() as typeof reports.$inferSelect;
		expect(updated.status).toBe("resolved");
	});
});
