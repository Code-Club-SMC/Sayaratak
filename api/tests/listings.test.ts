import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

mock.module("../src/lib/monetization", () => ({
	checkListingLimit: () => Promise.resolve(true),
}));

const { listingsApp } = await import("../src/routes/listings");
const { taxonomyApp } = await import("../src/routes/taxonomy");
const { locationsApp } = await import("../src/routes/locations");
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";

// Concrete TypeScript Types (Using type instead of interface)
type Listing = {
	id: string;
	userId: string;
	categoryId: string;
	makeId: string | null;
	modelId: string | null;
	countryId: string;
	cityId: string;
	districtId: string | null;
	title: string;
	description: string;
	price: number;
	currency: string;
	rentalPeriod?: string | null;
	status: string;
	lat: number | null;
	lng: number | null;
	favoriteCount?: number;
	specs: Record<string, any>;
	media: Array<{ url: string; isPrimary: boolean }>;
	year: number | null;
	transmission: string | null;
	fuelType: string | null;
	mileage: number | null;
	condition: string | null;
	createdAt: string;
	updatedAt: string;
};

type ApiError = {
	error: string;
};

type ApiSuccessMessage = {
	success: boolean;
	message: string;
};

describe("Listings Engine Endpoints", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	let categoryId = "";
	let countryId = "";
	let cityId = "";
	let createdListingId = "";

	test("Setup - get taxonomy and locations for foreign keys", async () => {
		// Ensure user exists for foreign key constraint
		await db.insert(user).values({
			id: "u1",
			name: "Test User",
			email: "testuser1@example.com",
			role: "user",
			accountType: "user"
		}).onConflictDoNothing();

		const catRes = await taxonomyApp.request("/categories");
		const categories = await catRes.json() as {id: string}[];
		categoryId = categories[0]?.id || "mock-category";

		const countryRes = await locationsApp.request("/countries");
		const countries = await countryRes.json() as {id: string}[];
		countryId = countries[0]?.id || "mock-country";

		const cityRes = await locationsApp.request("/cities");
		const cities = await cityRes.json() as {id: string}[];
		cityId = cities[0]?.id || "mock-city";
	});

	test("POST /api/listings creates a listing successfully", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const res = await listingsApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				categoryId,
				countryId,
				cityId,
				title: "Toyota Camry 2023",
				description: "Excellent condition",
				price: 15000000,
				currency: "SDG",
				status: "available",
				lat: 15.500654,
				lng: 32.559899,
				year: 2023,
				transmission: "Automatic",
				fuelType: "Petrol",
				mileage: 15000,
				condition: "Used",
				specs: {
					color: "White"
				},
				media: [
					{ url: "https://example.com/camry1.jpg", isPrimary: true }
				],
				rentalPeriod: "monthly"
			}),
		});
		
		expect(res.status).toBe(201);
		const listing = await res.json() as Listing;
		expect(listing.title).toBe("Toyota Camry 2023");
		expect(listing.status).toBe("available");
		expect(listing.rentalPeriod).toBe("monthly");
		expect(listing.year).toBe(2023);
		expect(listing.transmission).toBe("Automatic");
		
		createdListingId = listing.id;
	});

	test("GET /api/listings supports advanced filtering on dedicated columns", async () => {
		// Matching filter
		const matchRes = await listingsApp.request("/?minYear=2020&transmission=Automatic");
		expect(matchRes.status).toBe(200);
		const matchData = await matchRes.json() as Listing[];
		expect(matchData.some(l => l.id === createdListingId)).toBe(true);

		// Non-matching filter
		const noMatchRes = await listingsApp.request("/?transmission=Manual");
		expect(noMatchRes.status).toBe(200);
		const noMatchData = await noMatchRes.json() as Listing[];
		expect(noMatchData.some(l => l.id === createdListingId)).toBe(false);
	});

	test("GET /api/listings/map supports PostGIS clustering", async () => {
		// Valid bounding box containing Khartoum
		const mapRes = await listingsApp.request("/map?minLat=15.0&maxLat=16.0&minLng=32.0&maxLng=33.0&zoom=10");
		expect(mapRes.status).toBe(200);
		const clusters = await mapRes.json() as any[];
		
		// Should find at least 1 cluster containing our listing
		expect(clusters.length).toBeGreaterThan(0);
		expect(Number(clusters[0].count)).toBeGreaterThanOrEqual(1);
		expect(clusters[0].lat).toBeDefined();
		expect(clusters[0].lng).toBeDefined();
		
		// Missing bounding box should fail
		const badRes = await listingsApp.request("/map?minLat=15.0");
		expect(badRes.status).toBe(400);
	});

	test("GET /api/listings fetches listings and tests Haversine radius search", async () => {
		// Normal fetch
		const res = await listingsApp.request("/");
		expect(res.status).toBe(200);
		const listings = await res.json() as Listing[];
		expect(listings.length).toBeGreaterThan(0);

		// Radius search: Very close coordinates (should find the listing)
		const radiusRes = await listingsApp.request("/?lat=15.5&lng=32.5&radius=50");
		expect(radiusRes.status).toBe(200);
		const radiusListings = await radiusRes.json() as Listing[];
		expect(radiusListings.some(l => l.id === createdListingId)).toBe(true);

		// Radius search: Very far coordinates (should not find the listing)
		const farRes = await listingsApp.request("/?lat=40.7128&lng=-74.0060&radius=50");
		expect(farRes.status).toBe(200);
		const farListings = await farRes.json() as Listing[];
		expect(farListings.some(l => l.id === createdListingId)).toBe(false);
	});

	test("GET /api/listings/:id fetches single listing", async () => {
		const res = await listingsApp.request(`/${createdListingId}`);
		expect(res.status).toBe(200);
		const listing = await res.json() as Listing;
		expect(listing.id).toBe(createdListingId);
	});

	test("PUT /api/listings/:id updates listing if owner", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const res = await listingsApp.request(`/${createdListingId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				price: 14000000,
			}),
		});

		expect(res.status).toBe(200);
		const listing = await res.json() as Listing;
		expect(listing.price).toBe(14000000);
	});

	test("PUT /api/listings/:id fails if not owner", async () => {
		getSession.mockResolvedValue({
			session: { id: "s2" },
			user: { id: "u2", role: "user", banned: false, accountType: "user" },
		});

		const res = await listingsApp.request(`/${createdListingId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ price: 10000 }),
		});

		expect(res.status).toBe(403);
	});

	test("DELETE /api/listings/:id soft deletes listing", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const res = await listingsApp.request(`/${createdListingId}`, {
			method: "DELETE",
		});

		expect(res.status).toBe(200);
		const result = await res.json() as ApiSuccessMessage;
		expect(result.success).toBe(true);

		// Verify it's hard deleted
		const getRes = await listingsApp.request(`/${createdListingId}`);
		expect(getRes.status).toBe(404);
	});

	test("POST /api/listings/:id/clicks ignores bot user agents and returns success", async () => {
		const botRes = await listingsApp.request("/non-existent-id/clicks", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
			},
			body: JSON.stringify({ type: "view" }),
		});
		expect(botRes.status).toBe(200);
		const botData = await botRes.json() as { success: boolean };
		expect(botData.success).toBe(true);
	});
});
