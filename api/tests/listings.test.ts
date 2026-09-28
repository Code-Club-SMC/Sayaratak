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

	// This file authenticates via the `getSession` mock rather than real cookies, so
	// `sellerCookie` stands in for "the seller identity to authenticate as" — it's the
	// fixture user id fed into the mocked session, not a literal cookie header.
	const sellerCookie = "u1";

	// Creates a listing via the authenticated create endpoint, then forces its status
	// directly in the DB so lifecycle states unreachable through the public API
	// (pending/rejected/banned are admin-moderation-only) can still be exercised here.
	async function createListingWithStatus(
		cookie: string,
		status: string,
		overrides: Record<string, unknown> = {},
	) {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: cookie, role: "user", banned: false, accountType: "user" },
		});

		const res = await listingsApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				categoryId,
				countryId,
				cityId,
				title: "Lifecycle Fixture Listing",
				description: "Listing created to exercise lifecycle status transitions",
				price: 5000000,
				currency: "SDG",
				status: "available",
				specs: {},
				media: [],
				...overrides,
			}),
		});
		const created = (await res.json()) as Listing;

		if (created.status !== status) {
			await db
				.update(listings)
				.set({ status })
				.where(eq(listings.id, created.id));
		}

		return { ...created, status };
	}

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

	test("GET /api/listings redacts raw contact fields and the account phone, exposing only the derived contact object", async () => {
		const listing = await createListingWithStatus(sellerCookie, "available", {
			contactPhone: "+249900000004",
			contactPhoneEnabled: true,
		});

		const res = await listingsApp.request("/");
		expect(res.status).toBe(200);
		const page = (await res.json()) as { items: any[] };
		const item = page.items.find((l) => l.id === listing.id);
		expect(item).toBeDefined();
		expect(item.contact.phone).toBe("+249900000004");
		expect(item.contact.canMessage).toBe(true);
		// Raw consent columns must never leak on the public list path.
		expect(item.contactPhone).toBeUndefined();
		expect(item.contactPhoneEnabled).toBeUndefined();
		expect(item.contactWhatsapp).toBeUndefined();
		expect(item.contactWhatsappEnabled).toBeUndefined();
		expect(item.user.phone).toBeUndefined();
	});

	test("GET /api/listings/:id fetches single listing", async () => {
		const res = await listingsApp.request(`/${createdListingId}`);
		expect(res.status).toBe(200);
		const listing = (await res.json()) as Listing;
		expect(listing.id).toBe(createdListingId);
		expect(listing.city?.id).toBe(cityId);
		expect(listing.user?.id).toBe("u1");
		expect(listing.user?.name).toBe("Test User");
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

		// Draft listings never became public: 404, not the old blanket 410.
		const publicDetailRes = await listingsApp.request(`/${draftListing.id}`);
		expect(publicDetailRes.status).toBe(404);

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

	test("GET /listings/:id is 404 for draft/pending/rejected/banned listings", async () => {
		for (const status of ["draft", "pending", "rejected", "banned"]) {
			const listing = await createListingWithStatus(sellerCookie, status);
			const res = await listingsApp.request(`/${listing.id}`);
			expect(res.status).toBe(404);
		}
	});

	test("GET /listings/:id returns 200 and a marked, contact-closed detail for reserved/sold/rented", async () => {
		for (const status of ["reserved", "sold", "rented"]) {
			const listing = await createListingWithStatus(sellerCookie, status);
			const res = await listingsApp.request(`/${listing.id}`);
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.status).toBe(status);
			expect(json.contact.canMessage).toBe(false);
			expect(json.contact.phone).toBeNull();
			expect(json.contact.whatsapp).toBeNull();
		}
	});

	test("GET /listings/:id keeps contact closed for reserved/sold/rented even when a real, enabled contact number is on record", async () => {
		// Unlike the test above, these listings DO have live, enabled contact numbers.
		// If the `canMessage &&` gate in withPublicContact were ever dropped, this is the
		// test that would catch a real phone number leaking on a closed listing.
		for (const status of ["reserved", "sold", "rented"]) {
			const listing = await createListingWithStatus(sellerCookie, status, {
				contactPhone: "+249900000002",
				contactPhoneEnabled: true,
				contactWhatsapp: "+249900000003",
				contactWhatsappEnabled: true,
			});
			const res = await listingsApp.request(`/${listing.id}`);
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.contact.canMessage).toBe(false);
			expect(json.contact.phone).toBeNull();
			expect(json.contact.whatsapp).toBeNull();
		}
	});

	test("GET /listings/:id never returns the account login phone, only opted-in listing contact fields", async () => {
		const listing = await createListingWithStatus(sellerCookie, "available", {
			contactPhone: "+249900000001",
			contactPhoneEnabled: true,
		});
		const res = await listingsApp.request(`/${listing.id}`);
		const json = await res.json();
		expect(json.contact.phone).toBe("+249900000001");
		expect(json.contact.whatsapp).toBeNull(); // whatsapp was never enabled
		expect(json.user.phone).toBeUndefined();
		expect(json.contactPhone).toBeUndefined(); // raw field must not leak on the public path
		expect(json.contactPhoneEnabled).toBeUndefined();
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

	test("POST /api/listings rejects contactPhoneEnabled=true with no phone", async () => {
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
				title: "Toyota Corolla 2022",
				description: "Well maintained sedan, single owner",
				price: 12000000,
				currency: "SDG",
				status: "available",
				contactPhoneEnabled: true,
			}),
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as ApiError & { code: string };
		expect(json.code).toBe("CONTACT_PHONE_REQUIRED");
	});

	test("POST /api/listings accepts contactPhoneEnabled=true with a phone and never copies the account phone", async () => {
		const sellerAccountPhone = "+249900000000";
		await db
			.update(user)
			.set({ phone: sellerAccountPhone })
			.where(eq(user.id, "u1"));

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
				title: "Toyota Corolla 2022",
				description: "Well maintained sedan, single owner",
				price: 12000000,
				currency: "SDG",
				status: "available",
				contactPhone: "+249911111111",
				contactPhoneEnabled: true,
			}),
		});

		expect(res.status).toBe(201);
		const json = (await res.json()) as Listing & { contactPhone: string | null };
		expect(json.contactPhone).toBe("+249911111111");
		// Seller's account login phone must never leak in here even implicitly.
		expect(json.contactPhone).not.toBe(sellerAccountPhone);

		await db.delete(listings).where(eq(listings.id, json.id));
		// Reset the fixture user's account phone so later tests in this file
		// don't depend on the value left behind by this test.
		await db.update(user).set({ phone: null }).where(eq(user.id, "u1"));
	});

	test("POST /api/listings rejects contactWhatsappEnabled=true with no whatsapp number", async () => {
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
				title: "Toyota Corolla 2022",
				description: "Well maintained sedan, single owner",
				price: 12000000,
				currency: "SDG",
				status: "available",
				contactWhatsappEnabled: true,
			}),
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as ApiError & { code: string };
		expect(json.code).toBe("CONTACT_WHATSAPP_REQUIRED");
	});

	test("POST /api/listings accepts contactWhatsappEnabled=true with a whatsapp number", async () => {
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
				title: "Toyota Corolla 2022",
				description: "Well maintained sedan, single owner",
				price: 12000000,
				currency: "SDG",
				status: "available",
				contactWhatsapp: "+249922222222",
				contactWhatsappEnabled: true,
			}),
		});

		expect(res.status).toBe(201);
		const json = (await res.json()) as Listing & {
			contactWhatsapp: string | null;
		};
		expect(json.contactWhatsapp).toBe("+249922222222");

		await db.delete(listings).where(eq(listings.id, json.id));
	});

	test("PUT /api/listings/:id rejects enabling phone without ever having provided a number", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const [draft] = await db
			.insert(listings)
			.values({
				userId: "u1",
				categoryId,
				countryId,
				cityId,
				title: "Draft Hyundai Accent",
				description: "Draft listing pending contact details",
				price: 8000000,
				currency: "SDG",
				status: "draft",
				specs: {},
				media: [],
			})
			.returning();

		const res = await listingsApp.request(`/${draft.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ contactPhoneEnabled: true }),
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as ApiError & { code: string };
		expect(json.code).toBe("CONTACT_PHONE_REQUIRED");

		await db.delete(listings).where(eq(listings.id, draft.id));
	});

	test("PUT /api/listings/:id keeps contactPhoneEnabled and the stored number unchanged when omitted from an unrelated update", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const [existingListing] = await db
			.insert(listings)
			.values({
				userId: "u1",
				categoryId,
				countryId,
				cityId,
				title: "Available Kia Sportage",
				description: "Listing with phone consent already granted",
				price: 9000000,
				currency: "SDG",
				status: "available",
				specs: {},
				media: [],
				contactPhone: "+249933333333",
				contactPhoneEnabled: true,
			})
			.returning();

		// Unrelated edit: only price changes, contact fields are not sent at all.
		const res = await listingsApp.request(`/${existingListing.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ price: 9500000 }),
		});

		expect(res.status).toBe(200);
		const json = (await res.json()) as Listing & {
			contactPhone: string | null;
			contactPhoneEnabled: boolean;
		};
		expect(json.price).toBe(9500000);
		// Previously-granted consent must survive an edit that never mentions it.
		expect(json.contactPhoneEnabled).toBe(true);
		expect(json.contactPhone).toBe("+249933333333");

		await db.delete(listings).where(eq(listings.id, existingListing.id));
	});

	test("PUT /api/listings/:id keeps contactWhatsappEnabled and the stored number unchanged when omitted from an unrelated update", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const [existingListing] = await db
			.insert(listings)
			.values({
				userId: "u1",
				categoryId,
				countryId,
				cityId,
				title: "Available Kia Sportage",
				description: "Listing with whatsapp consent already granted",
				price: 9000000,
				currency: "SDG",
				status: "available",
				specs: {},
				media: [],
				contactWhatsapp: "+249944444444",
				contactWhatsappEnabled: true,
			})
			.returning();

		// Unrelated edit: only price changes, contact fields are not sent at all.
		const res = await listingsApp.request(`/${existingListing.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ price: 9500000 }),
		});

		expect(res.status).toBe(200);
		const json = (await res.json()) as Listing & {
			contactWhatsapp: string | null;
			contactWhatsappEnabled: boolean;
		};
		expect(json.price).toBe(9500000);
		// Previously-granted consent must survive an edit that never mentions it.
		expect(json.contactWhatsappEnabled).toBe(true);
		expect(json.contactWhatsapp).toBe("+249944444444");

		await db.delete(listings).where(eq(listings.id, existingListing.id));
	});

	test("PUT /api/listings/:id rejects enabling whatsapp without ever having provided a number", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});

		const [draft] = await db
			.insert(listings)
			.values({
				userId: "u1",
				categoryId,
				countryId,
				cityId,
				title: "Draft Hyundai Accent",
				description: "Draft listing pending contact details",
				price: 8000000,
				currency: "SDG",
				status: "draft",
				specs: {},
				media: [],
			})
			.returning();

		const res = await listingsApp.request(`/${draft.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ contactWhatsappEnabled: true }),
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as ApiError & { code: string };
		expect(json.code).toBe("CONTACT_WHATSAPP_REQUIRED");

		await db.delete(listings).where(eq(listings.id, draft.id));
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
