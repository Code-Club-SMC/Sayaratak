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

import { profilesApp } from "../src/routes/profiles";
import { listingsApp } from "../src/routes/listings";
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { dealerships, workshops, mechanics } from "../src/db/schemas/profile-schema";
import { listings } from "../src/db/schemas/listing-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";

describe("Profiles & Listing Status Endpoints", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	let dealershipId = "";
	let listingId = "";
	let dealerUserId = "";

	test("Setup - mock data", async () => {
		const uuid = crypto.randomUUID();
		dealerUserId = "u_dealer2_" + uuid;
		await db.insert(user).values({
			id: dealerUserId, name: "Dealer2", email: `dealer2_${uuid}@e.com`, role: "user", accountType: "dealership"
		}).onConflictDoNothing();

		const [dealer] = await db.insert(dealerships).values({
			userId: dealerUserId, name: "Dealer Profile"
		}).returning();
		dealershipId = dealer.id;

		const [cat] = await db.insert(categories).values({ slug: "c_prof_" + uuid, nameEn: "C", nameAr: "C" }).returning();
		const [country] = await db.insert(countries).values({ code: "SD2_" + uuid, nameEn: "SD", nameAr: "SD" }).returning();
		const [city] = await db.insert(cities).values({ countryId: country.id, nameEn: "City", nameAr: "City" }).returning();

		const [listing] = await db.insert(listings).values({
			userId: dealerUserId, categoryId: cat.id, countryId: country.id, cityId: city.id,
			title: "Listing Profile Test", description: "Desc", price: 100, status: "available",
			contactWhatsapp: "+249900000005",
			contactWhatsappEnabled: true
		}).returning();
		listingId = listing.id;
	});

	test("GET /profiles/dealership/:id returns profile and user info", async () => {
		const res = await profilesApp.request(`/dealership/${dealershipId}`);
		expect(res.status).toBe(200);
		const profile = await res.json() as typeof dealerships.$inferSelect;
		expect(profile.name).toBe("Dealer Profile");
	});

	test("PATCH /profiles/dealership allows owner to update", async () => {
		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, dealershipId));
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: dealer.userId, role: "user", accountType: "dealership" } });
		
		const res = await profilesApp.request(`/dealership`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Updated Dealer" })
		});
		expect(res.status).toBe(200);
		const updated = await res.json() as typeof dealerships.$inferSelect;
		expect(updated.name).toBe("Updated Dealer");
	});

	test("PATCH /listings/:id/status updates status to reserved", async () => {
		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, dealershipId));
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: dealer.userId, role: "user" } });
		
		const res = await listingsApp.request(`/${listingId}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "reserved" })
		});
		expect(res.status).toBe(200);
		const updated = await res.json() as typeof listings.$inferSelect;
		expect(updated.status).toBe("reserved");
	});

	test("PATCH /listings/:id/status prevents invalid status", async () => {
		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, dealershipId));
		getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: dealer.userId, role: "user" } });
		
		const res = await listingsApp.request(`/${listingId}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "invalid_status_here" })
		});
		expect(res.status).toBe(400);
	});

	test("POST /listings/:id/clicks increments analytics", async () => {
		// Create a dedicated listing for this test to avoid mutation of the shared fixture
		// (the previous test PATCH'd listingId to status: "reserved")
		const [cat] = await db.select().from(categories).limit(1);
		const [country] = await db.select().from(countries).limit(1);
		const [city] = await db.select().from(cities).where(eq(cities.countryId, country.id)).limit(1);
		const [dedicatedListing] = await db.insert(listings).values({
			userId: dealerUserId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Click Analytics Test Listing",
			description: "Dedicated listing for analytics testing",
			price: 100,
			status: "available",
			contactWhatsapp: "+249900000005",
			contactWhatsappEnabled: true
		}).returning();

		// Test whatsapp click increments counter
		const res = await listingsApp.request(`/${dedicatedListing.id}/clicks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: "whatsapp" })
		});
		expect(res.status).toBe(200);

		// Verify increment in database
		const [updated] = await db.select().from(listings).where(eq(listings.id, dedicatedListing.id));
		expect(updated.whatsappClickCount).toBe(1);
	});

	test("PATCH /profiles/workshop updates images gallery and workingHours", async () => {
		const uuid = crypto.randomUUID();
		const userId = "u_ws_" + uuid;
		await db.insert(user).values({
			id: userId, name: "Workshop User", email: `ws_${uuid}@e.com`, role: "user", accountType: "workshop"
		});
		const [ws] = await db.insert(workshops).values({
			userId, name: "Original Workshop"
		}).returning();

		getSession.mockResolvedValue({ session: { id: "s_ws" }, user: { id: userId, role: "user", accountType: "workshop" } });

		const res = await profilesApp.request("/workshop", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Pro Auto Workshop",
				images: ["https://example.com/ws1.jpg", "https://example.com/ws2.jpg"],
				workingHours: { mon: "8am-5pm", fri: "closed" }
			})
		});

		expect(res.status).toBe(200);
		const updated = await res.json() as typeof workshops.$inferSelect;
		expect(updated.name).toBe("Pro Auto Workshop");
		expect(updated.images).toEqual(["https://example.com/ws1.jpg", "https://example.com/ws2.jpg"]);
	});

	test("PATCH /profiles/mechanic updates portfolioImages and specialization", async () => {
		const uuid = crypto.randomUUID();
		const userId = "u_mech_" + uuid;
		await db.insert(user).values({
			id: userId, name: "Mechanic User", email: `mech_${uuid}@e.com`, role: "user", accountType: "mechanic"
		});
		const [mech] = await db.insert(mechanics).values({
			userId, name: "Original Mechanic"
		}).returning();

		getSession.mockResolvedValue({ session: { id: "s_mech" }, user: { id: userId, role: "user", accountType: "mechanic" } });

		const res = await profilesApp.request("/mechanic", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				specialization: "Engine Specialist",
				portfolioImages: ["https://example.com/engine1.jpg", "https://example.com/engine2.jpg"]
			})
		});

		expect(res.status).toBe(200);
		const updated = await res.json() as typeof mechanics.$inferSelect;
		expect(updated.specialization).toBe("Engine Specialist");
		expect(updated.portfolioImages).toEqual(["https://example.com/engine1.jpg", "https://example.com/engine2.jpg"]);
	});
});
