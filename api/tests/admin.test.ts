import { describe, test, expect, mock, beforeEach } from "bun:test";

const createUser = mock();
const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			createUser,
			getSession,
		},
	},
}));

const { auth } = await import("../lib/auth");
const { adminApp } = await import("../src/routes/admin");
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { dealerships, workshops, mechanics } from "../src/db/schemas/profile-schema";
import { subscriptionPackages, userSubscriptions, payments } from "../src/db/schemas/monetization-schema";
import { banners } from "../src/db/schemas/content-schema";
import { listings } from "../src/db/schemas/listing-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { reports } from "../src/db/schemas/social-schema";
import { eq } from "drizzle-orm";

describe("POST /create", () => {
	beforeEach(() => {
		createUser.mockReset();
		getSession.mockReset();
		process.env.ADMIN_CREATE_SECRET = "test-secret";
	});

	test("returns 401 when x-secret-key missing", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "a@b.com", password: "pass", name: "Admin" }),
		});
		expect(res.status).toBe(401);
	});

	test("returns 401 when x-secret-key wrong", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "wrong" },
			body: JSON.stringify({ email: "a@b.com", password: "pass", name: "Admin" }),
		});
		expect(res.status).toBe(401);
	});

	test("returns 400 when fields missing", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "test-secret" },
			body: JSON.stringify({ email: "a@b.com" }),
		});
		expect(res.status).toBe(400);
	});

	test("creates admin when secret correct", async () => {
		createUser.mockResolvedValue({
			user: { id: "u1", email: "a@b.com", name: "Admin", role: "admin" },
		});
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "test-secret" },
			body: JSON.stringify({ email: "a@b.com", password: "pass123", name: "Admin" }),
		});
		expect(res.status).toBe(201);
		expect(auth.api.createUser).toHaveBeenCalledWith({
			body: {
				email: "a@b.com",
				password: "pass123",
				name: "Admin",
				role: "admin",
				data: { accountType: "user" },
			},
		});
		const json = (await res.json()) as { role: string };
		expect(json.role).toBe("admin");
	});
});

describe("Admin Profiles & Subscriptions", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("PATCH /profiles/:type/:id/verify guards: 403 unauth/non-admin, 400 invalid type/field, 404 not found, 200 success", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_" + uuid;
		const dealerUserId = "u_d_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: dealerUserId, name: "Dealer", email: `${dealerUserId}@e.com`, role: "user", accountType: "dealership"
		});

		// 1. Unauthenticated -> 403
		getSession.mockResolvedValue(null);
		const unauthRes = await adminApp.request(`/profiles/dealership/non-existent/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: true })
		});
		expect(unauthRes.status).toBe(403);

		// 2. Non-admin -> 403
		getSession.mockResolvedValue({
			session: { id: "s_user" },
			user: { id: dealerUserId, role: "user", accountType: "dealership" }
		});
		const nonAdminRes = await adminApp.request(`/profiles/dealership/non-existent/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: true })
		});
		expect(nonAdminRes.status).toBe(403);

		// Switch to admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 3. Invalid field type -> 400
		const badFieldRes = await adminApp.request(`/profiles/dealership/non-existent/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: "true" })
		});
		expect(badFieldRes.status).toBe(400);

		// 4. Invalid profile type -> 400
		const badTypeRes = await adminApp.request(`/profiles/unknown/non-existent/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: true })
		});
		expect(badTypeRes.status).toBe(400);

		// 5. Not found -> 404
		const notFoundRes = await adminApp.request(`/profiles/dealership/00000000-0000-0000-0000-000000000000/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: true })
		});
		expect(notFoundRes.status).toBe(404);

		// 6. Success -> 200
		const [dealer] = await db.insert(dealerships).values({
			userId: dealerUserId, name: "Verify Dealer", isVerified: false
		}).returning();

		const res = await adminApp.request(`/profiles/dealership/${dealer.id}/verify`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isVerified: true })
		});
		expect(res.status).toBe(200);
		const updated = await res.json() as typeof dealerships.$inferSelect;
		expect(updated.isVerified).toBe(true);
	});

	test("PATCH /payments/:id/approve guards: 403 unauth/non-admin, 400 invalid status/already processed, 404 not found", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_" + uuid;
		const targetUserId = "user_sub_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: targetUserId, name: "Sub User", email: `${targetUserId}@e.com`, role: "user", accountType: "dealership"
		});

		// 1. Unauthenticated -> 403
		getSession.mockResolvedValue(null);
		const unauthRes = await adminApp.request(`/payments/non-existent/approve`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "completed" })
		});
		expect(unauthRes.status).toBe(403);

		// Admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 2. Invalid status -> 400
		const badStatusRes = await adminApp.request(`/payments/non-existent/approve`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "invalid" })
		});
		expect(badStatusRes.status).toBe(400);

		// 3. Not found -> 404
		const notFoundRes = await adminApp.request(`/payments/00000000-0000-0000-0000-000000000000/approve`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "completed" })
		});
		expect(notFoundRes.status).toBe(404);

		// 4. Already processed -> 400
		const [completedPay] = await db.insert(payments).values({
			userId: targetUserId,
			amount: 50000,
			currency: "SDG",
			method: "bankak",
			status: "completed",
			purpose: "subscription",
		}).returning();

		const alreadyProcessedRes = await adminApp.request(`/payments/${completedPay.id}/approve`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "completed" })
		});
		expect(alreadyProcessedRes.status).toBe(400);
	});

	test("PATCH /payments/:id/approve extends subscription from existing endDate without losing days", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_" + uuid;
		const targetUserId = "user_sub_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: targetUserId, name: "Sub User", email: `${targetUserId}@e.com`, role: "user", accountType: "dealership"
		});

		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// Create subscription package (30 days)
		const [pkg] = await db.insert(subscriptionPackages).values({
			nameEn: "Pro Package " + uuid,
			nameAr: "باقة برو",
			roleTarget: "dealership",
			price: 50000,
			durationDays: 30,
		}).returning();

		// User already has an active sub that ends 10 days in the future
		const futureEnd = new Date();
		futureEnd.setDate(futureEnd.getDate() + 10);

		const [sub] = await db.insert(userSubscriptions).values({
			userId: targetUserId,
			packageId: pkg.id,
			status: "active",
			startDate: new Date(),
			endDate: futureEnd,
		}).returning();

		// Pending payment
		const [pay] = await db.insert(payments).values({
			userId: targetUserId,
			amount: 50000,
			currency: "SDG",
			method: "bankak",
			status: "pending",
			purpose: "subscription",
			referenceId: pkg.id,
		}).returning();

		// Admin approves payment
		const res = await adminApp.request(`/payments/${pay.id}/approve`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "completed" })
		});
		expect(res.status).toBe(200);

		// Verify that the new endDate is futureEnd + 30 days (~40 days from now, NOT 30 days from now)
		const [updatedSub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, sub.id));
		const expectedEndDateApprox = new Date(futureEnd);
		expectedEndDateApprox.setDate(expectedEndDateApprox.getDate() + 30);

		const actualTime = new Date(updatedSub.endDate).getTime();
		const expectedTime = expectedEndDateApprox.getTime();

		expect(Math.abs(actualTime - expectedTime)).toBeLessThan(5000);
	});
});

describe("Admin Banners CRUD Management", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("GET, POST, PUT, DELETE /banners full lifecycle with validation and auth boundaries", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_b_" + uuid;
		const regularUserId = "user_b_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin Banner", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: regularUserId, name: "Regular User", email: `${regularUserId}@e.com`, role: "user", accountType: "user"
		});

		// 1. Auth check: unauthenticated -> 403
		getSession.mockResolvedValue(null);
		const unauthGet = await adminApp.request("/banners");
		expect(unauthGet.status).toBe(403);

		// 2. Auth check: non-admin -> 403
		getSession.mockResolvedValue({
			session: { id: "s_reg" },
			user: { id: regularUserId, role: "user", accountType: "user" }
		});
		const nonAdminPost = await adminApp.request("/banners", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Banner", imageUrl: "https://example.com/banner.jpg", endDate: new Date() })
		});
		expect(nonAdminPost.status).toBe(403);

		// Admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 3. Validation: missing title -> 400
		const badPost = await adminApp.request("/banners", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ imageUrl: "https://example.com/banner.jpg" })
		});
		expect(badPost.status).toBe(400);

		// 4. Create Banner -> 201
		const endDate = new Date(Date.now() + 86400000 * 7).toISOString();
		const createRes = await adminApp.request("/banners", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Spring Promo " + uuid,
				imageUrl: "https://res.cloudinary.com/test/image/upload/v1/banners/spring.jpg",
				targetUrl: "https://sayaratak.com/promo",
				placement: "home_top",
				endDate,
				isActive: true
			})
		});
		expect(createRes.status).toBe(201);
		const createdBanner = await createRes.json() as typeof banners.$inferSelect;
		expect(createdBanner.title).toBe("Spring Promo " + uuid);

		// 5. Get Banners -> 200 list
		const getRes = await adminApp.request("/banners");
		expect(getRes.status).toBe(200);
		const list = await getRes.json() as (typeof banners.$inferSelect)[];
		expect(Array.isArray(list)).toBe(true);
		expect(list.some(b => b.id === createdBanner.id)).toBe(true);

		// 6. Update Banner -> 200
		const updateRes = await adminApp.request(`/banners/${createdBanner.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Updated Spring Promo" })
		});
		expect(updateRes.status).toBe(200);
		const updatedBanner = await updateRes.json() as typeof banners.$inferSelect;
		expect(updatedBanner.title).toBe("Updated Spring Promo");

		// 7. Update Non-existent Banner -> 404
		const notFoundPut = await adminApp.request("/banners/00000000-0000-0000-0000-000000000000", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Ghost" })
		});
		expect(notFoundPut.status).toBe(404);

		// 8. Delete Banner -> 200
		const deleteRes = await adminApp.request(`/banners/${createdBanner.id}`, {
			method: "DELETE"
		});
		expect(deleteRes.status).toBe(200);

		// 9. Delete Non-existent Banner -> 404
		const notFoundDelete = await adminApp.request("/banners/00000000-0000-0000-0000-000000000000", {
			method: "DELETE"
		});
		expect(notFoundDelete.status).toBe(404);
	});
});

describe("Admin User Management & Listing Cascading Ban", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("GET /users and PATCH /users/:id/ban bans user and cascades 'banned' status to user's listings", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_u_" + uuid;
		const targetUserId = "target_u_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: targetUserId, name: "Bad Actor", email: `${targetUserId}@e.com`, role: "user", accountType: "user", banned: false
		});

		// Create locations and category for listing
		const [country] = await db.insert(countries).values({
			nameEn: "Sudan " + uuid, nameAr: "السودان", code: "S" + uuid.replace(/-/g, "").slice(0, 8).toUpperCase()
		}).returning();
		const [city] = await db.insert(cities).values({
			countryId: country.id, nameEn: "Khartoum " + uuid, nameAr: "الخرطوم"
		}).returning();
		const [cat] = await db.insert(categories).values({
			nameEn: "Sedan " + uuid, nameAr: "سيدان", slug: "sedan-" + uuid
		}).returning();

		// Create listings for the target user
		const [listing1] = await db.insert(listings).values({
			userId: targetUserId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Listing 1 to ban",
			description: "Description 10+ characters",
			price: 10000,
			status: "available"
		}).returning();

		// 1. Non-admin cannot view users -> 403
		getSession.mockResolvedValue({
			session: { id: "s_target" },
			user: { id: targetUserId, role: "user", accountType: "user" }
		});
		const unauthUsers = await adminApp.request("/users");
		expect(unauthUsers.status).toBe(403);

		// Admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 2. Admin views users list -> 200
		const usersRes = await adminApp.request("/users");
		expect(usersRes.status).toBe(200);
		const userList = await usersRes.json() as (typeof user.$inferSelect)[];
		expect(userList.some(u => u.id === targetUserId)).toBe(true);

		// 3. Ban user -> 200
		const banRes = await adminApp.request(`/users/${targetUserId}/ban`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ banned: true, banReason: "Violated TOS" })
		});
		expect(banRes.status).toBe(200);
		const bannedUser = await banRes.json() as typeof user.$inferSelect;
		expect(bannedUser.banned).toBe(true);
		expect(bannedUser.banReason).toBe("Violated TOS");

		// 4. Verify cascade ban on user's listing
		const [bannedListing] = await db.select().from(listings).where(eq(listings.id, listing1.id));
		expect(bannedListing.status).toBe("banned");

		// 5. Unban user -> 200
		const unbanRes = await adminApp.request(`/users/${targetUserId}/ban`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ banned: false })
		});
		expect(unbanRes.status).toBe(200);
		const unbannedUser = await unbanRes.json() as typeof user.$inferSelect;
		expect(unbannedUser.banned).toBe(false);
		expect(unbannedUser.banReason).toBeNull();

		// Cleanup
		await db.delete(listings).where(eq(listings.id, listing1.id));
		await db.delete(categories).where(eq(categories.id, cat.id));
		await db.delete(cities).where(eq(cities.id, city.id));
		await db.delete(countries).where(eq(countries.id, country.id));
		await db.delete(user).where(eq(user.id, targetUserId));
		await db.delete(user).where(eq(user.id, adminUserId));
	});
});

describe("Admin Listing Moderation", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("GET /listings and PATCH /listings/:id/moderate tests moderation lifecycle and status validation", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_l_" + uuid;
		const sellerId = "seller_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: sellerId, name: "Seller", email: `${sellerId}@e.com`, role: "user", accountType: "user"
		});

		const [country] = await db.insert(countries).values({
			nameEn: "Sudan " + uuid, nameAr: "السودان", code: "L" + uuid.slice(0, 2).toUpperCase()
		}).returning();
		const [city] = await db.insert(cities).values({
			countryId: country.id, nameEn: "Omdurman " + uuid, nameAr: "أم درمان"
		}).returning();
		const [cat] = await db.insert(categories).values({
			nameEn: "SUV " + uuid, nameAr: "دفع رباعي", slug: "suv-" + uuid
		}).returning();

		const [listing] = await db.insert(listings).values({
			userId: sellerId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Pending Moderate Listing",
			description: "Description 10+ characters",
			price: 25000,
			status: "pending"
		}).returning();

		// Admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 1. GET /listings with status filter
		const getListingsRes = await adminApp.request(`/listings?status=pending`);
		expect(getListingsRes.status).toBe(200);
		const pendingListings = await getListingsRes.json() as (typeof listings.$inferSelect)[];
		expect(pendingListings.some(l => l.id === listing.id)).toBe(true);

		// 2. PATCH invalid status -> 400
		const badStatusRes = await adminApp.request(`/listings/${listing.id}/moderate`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "invalid_status" })
		});
		expect(badStatusRes.status).toBe(400);

		// 3. Moderate listing to rejected -> 200
		const rejectRes = await adminApp.request(`/listings/${listing.id}/moderate`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "rejected" })
		});
		expect(rejectRes.status).toBe(200);
		const rejectedListing = await rejectRes.json() as typeof listings.$inferSelect;
		expect(rejectedListing.status).toBe("rejected");

		// 4. Moderate listing to available -> 200
		const approveRes = await adminApp.request(`/listings/${listing.id}/moderate`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "available" })
		});
		expect(approveRes.status).toBe(200);
		const approvedListing = await approveRes.json() as typeof listings.$inferSelect;
		expect(approvedListing.status).toBe("available");

		// 5. Moderate non-existent listing -> 404
		const notFoundRes = await adminApp.request(`/listings/00000000-0000-0000-0000-000000000000/moderate`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "banned" })
		});
		expect(notFoundRes.status).toBe(404);
	});
});

describe("Admin Analytics & Metrics", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("GET /metrics guards non-admin with 403 and returns complete count aggregations for admin", async () => {
		const uuid = crypto.randomUUID();
		const adminUserId = "admin_m_" + uuid;
		const regularUserId = "user_m_" + uuid;

		await db.insert(user).values({
			id: adminUserId, name: "Admin", email: `${adminUserId}@e.com`, role: "admin", accountType: "user"
		});
		await db.insert(user).values({
			id: regularUserId, name: "User", email: `${regularUserId}@e.com`, role: "user", accountType: "user"
		});

		// 1. Non-admin -> 403
		getSession.mockResolvedValue({
			session: { id: "s_user" },
			user: { id: regularUserId, role: "user", accountType: "user" }
		});
		const nonAdminRes = await adminApp.request("/metrics");
		expect(nonAdminRes.status).toBe(403);

		// Admin session
		getSession.mockResolvedValue({
			session: { id: "s_admin" },
			user: { id: adminUserId, role: "admin", accountType: "user" }
		});

		// 2. Admin -> 200 with structured metrics
		const res = await adminApp.request("/metrics");
		expect(res.status).toBe(200);
		const metrics = await res.json() as Record<string, number>;

		expect(typeof metrics.totalUsers).toBe("number");
		expect(typeof metrics.totalDealerships).toBe("number");
		expect(typeof metrics.totalWorkshops).toBe("number");
		expect(typeof metrics.totalMechanics).toBe("number");
		expect(typeof metrics.totalListings).toBe("number");
		expect(typeof metrics.totalVehicles).toBe("number");
		expect(typeof metrics.totalSubscriptions).toBe("number");
		expect(typeof metrics.revenue).toBe("number");
		expect(typeof metrics.pendingReports).toBe("number");
		expect(typeof metrics.pendingPayments).toBe("number");
	});
});
