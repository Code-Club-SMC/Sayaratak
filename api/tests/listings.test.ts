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
import { listings } from "../src/db/schemas/listing-schema";
import { eq } from "drizzle-orm";

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
	city?: { id: string; nameEn: string; nameAr: string } | null;
	district?: { id: string; nameEn: string; nameAr: string } | null;
	user?: {
		id: string;
		name: string;
		image: string | null;
		accountType: string;
	} | null;
};

type ApiError = {
	error: string;
};

type ApiSuccessMessage = {
	success: boolean;
	message: string;
};

type ListingPage = {
	items: Listing[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
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
		await db
			.insert(user)
			.values({
				id: "u1",
				name: "Test User",
				email: "testuser1@example.com",
				role: "user",
				accountType: "user",
			})
			.onConflictDoNothing();
		await db
			.insert(user)
			.values({
				id: "u2",
				name: "Other User",
				email: "testuser2@example.com",
				role: "user",
				accountType: "user",
			})
			.onConflictDoNothing();

		const catRes = await taxonomyApp.request("/categories");
		const categories = (await catRes.json()) as { id: string }[];
		categoryId = categories[0]?.id || "mock-category";

		const countryRes = await locationsApp.request("/countries");
		const countries = (await countryRes.json()) as { id: string }[];
		countryId = countries[0]?.id || "mock-country";

		const cityRes = await locationsApp.request("/cities");
		const cities = (await cityRes.json()) as { id: string }[];
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
					color: "White",
				},
				media: [{ url: "https://example.com/camry1.jpg", isPrimary: true }],
				rentalPeriod: "monthly",
			}),
		});

		expect(res.status).toBe(201);
		const listing = (await res.json()) as Listing;
		expect(listing.title).toBe("Toyota Camry 2023");
		expect(listing.status).toBe("available");
		expect(listing.rentalPeriod).toBe("monthly");
		expect(listing.year).toBe(2023);
		expect(listing.transmission).toBe("Automatic");

		createdListingId = listing.id;
	});

	test("GET /api/listings supports advanced filtering on dedicated columns", async () => {
		const privateStatusRes = await listingsApp.request("/?status=draft");
		expect(privateStatusRes.status).toBe(400);

		// Matching filter
		const matchRes = await listingsApp.request(
			"/?minYear=2020&transmission=Automatic",
		);
		expect(matchRes.status).toBe(200);
		const matchData = (await matchRes.json()) as ListingPage;
		expect(matchData.items.some((l) => l.id === createdListingId)).toBe(true);

		// Non-matching filter
		const noMatchRes = await listingsApp.request("/?transmission=Manual");
		expect(noMatchRes.status).toBe(200);
		const noMatchData = (await noMatchRes.json()) as ListingPage;
		expect(noMatchData.items.some((l) => l.id === createdListingId)).toBe(
			false,
		);
	});

	test("GET /api/listings supports keyword search and explicit sorting", async () => {
		const searchRes = await listingsApp.request("/?q=Camry&sort=price_asc");
		expect(searchRes.status).toBe(200);
		const searchData = (await searchRes.json()) as ListingPage;
		expect(searchData.items.some((l) => l.id === createdListingId)).toBe(true);

		const missRes = await listingsApp.request("/?q=DefinitelyNotThisListing");
		expect(missRes.status).toBe(200);
		const missData = (await missRes.json()) as ListingPage;
		expect(missData.items.some((l) => l.id === createdListingId)).toBe(false);
	});

	test("GET /api/listings/map supports PostGIS clustering", async () => {
		// Valid bounding box containing Khartoum
		const mapRes = await listingsApp.request(
			"/map?minLat=15.0&maxLat=16.0&minLng=32.0&maxLng=33.0&zoom=10",
		);
		expect(mapRes.status).toBe(200);
		const clusters = (await mapRes.json()) as any[];

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
		const listingPage = (await res.json()) as ListingPage;
		expect(listingPage.items.length).toBeGreaterThan(0);
		expect(listingPage.total).toBeGreaterThan(0);

		// Radius search: Very close coordinates (should find the listing)
		const radiusRes = await listingsApp.request(
			"/?lat=15.5&lng=32.5&radius=50",
		);
		expect(radiusRes.status).toBe(200);
		const radiusListings = (await radiusRes.json()) as ListingPage;
		expect(radiusListings.items.some((l) => l.id === createdListingId)).toBe(
			true,
		);

		// Radius search: Very far coordinates (should not find the listing)
		const farRes = await listingsApp.request(
			"/?lat=40.7128&lng=-74.0060&radius=50",
		);
		expect(farRes.status).toBe(200);
		const farListings = (await farRes.json()) as ListingPage;
		expect(farListings.items.some((l) => l.id === createdListingId)).toBe(
			false,
		);
	});

	test("GET /api/listings/:id fetches single listing", async () => {
		const res = await listingsApp.request(`/${createdListingId}`);
		expect(res.status).toBe(200);
		const listing = (await res.json()) as Listing;
		expect(listing.id).toBe(createdListingId);
		expect(listing.city?.id).toBe(cityId);
		expect(listing.user?.id).toBe("u1");
		expect(listing.user?.name).toBe("Test User");

		await db
			.update(listings)
			.set({ status: "sold" })
			.where(eq(listings.id, createdListingId));
		const goneRes = await listingsApp.request(`/${createdListingId}`);
		expect(goneRes.status).toBe(410);
		await db
			.update(listings)
			.set({ status: "available" })
			.where(eq(listings.id, createdListingId));
	});

	test("GET /api/listings/me and /manage/:id expose owner drafts without weakening public reads", async () => {
		const [draftListing] = await db
			.insert(listings)
			.values({
				userId: "u1",
				categoryId,
				countryId,
				cityId,
				title: "Draft Nissan Patrol",
				description: "Draft listing ready for image upload",
				price: 25000000,
				currency: "SDG",
				status: "draft",
				year: 2021,
				transmission: "Automatic",
				fuelType: "Petrol",
				mileage: 24000,
				condition: "Used",
				specs: { color: "Black" },
				media: [],
			})
			.returning();

		const noSessionRes = await listingsApp.request("/me");
		expect(noSessionRes.status).toBe(401);

		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const ownerListRes = await listingsApp.request("/me?status=draft");
		expect(ownerListRes.status).toBe(200);
		const ownerList = (await ownerListRes.json()) as ListingPage;
		expect(ownerList.items.some((l) => l.id === draftListing.id)).toBe(true);
		expect(ownerList.items.every((l) => l.userId === "u1")).toBe(true);

		const ownerDetailRes = await listingsApp.request(
			`/manage/${draftListing.id}`,
		);
		expect(ownerDetailRes.status).toBe(200);
		const ownerDetail = (await ownerDetailRes.json()) as Listing;
		expect(ownerDetail.id).toBe(draftListing.id);
		expect(ownerDetail.status).toBe("draft");

		const publicDetailRes = await listingsApp.request(`/${draftListing.id}`);
		expect(publicDetailRes.status).toBe(410);

		getSession.mockResolvedValue({
			session: { id: "s2" },
			user: { id: "u2", role: "user", banned: false, accountType: "user" },
		});

		const nonOwnerDetailRes = await listingsApp.request(
			`/manage/${draftListing.id}`,
		);
		expect(nonOwnerDetailRes.status).toBe(403);

		await db.delete(listings).where(eq(listings.id, draftListing.id));
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
		const listing = (await res.json()) as Listing;
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
		const result = (await res.json()) as ApiSuccessMessage;
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
				"User-Agent":
					"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
			},
			body: JSON.stringify({ type: "view" }),
		});
		expect(botRes.status).toBe(200);
		const botData = (await botRes.json()) as { success: boolean };
		expect(botData.success).toBe(true);
	});
});
