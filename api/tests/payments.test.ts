import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { paymentsApp } = await import("../src/routes/payments");
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { subscriptionPackages, payments } from "../src/db/schemas/monetization-schema";
import { listings } from "../src/db/schemas/listing-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { eq } from "drizzle-orm";

describe("Payments & Checkout Endpoints", () => {
	let userId: string;
	let otherUserId: string;
	let packageId: string;
	let listingId: string;

	beforeEach(async () => {
		getSession.mockReset();

		const uuid = crypto.randomUUID();
		userId = "u_pay_" + uuid;
		otherUserId = "u_pay_other_" + uuid;

		await db.insert(user).values([
			{ id: userId, name: "Pay User", email: `${userId}@example.com`, role: "user", accountType: "dealership" },
			{ id: otherUserId, name: "Other Pay User", email: `${otherUserId}@example.com`, role: "user", accountType: "user" },
		]);

		const [pkg] = await db.insert(subscriptionPackages).values({
			nameEn: "Gold Plan " + uuid,
			nameAr: "الباقة الذهبية",
			roleTarget: "dealership",
			price: 100000,
			durationDays: 60,
			listingLimit: 50,
		}).returning();
		packageId = pkg.id;

		const [country] = await db.insert(countries).values({
			nameEn: "Sudan " + uuid, nameAr: "السودان", code: "P" + uuid.slice(0, 2).toUpperCase()
		}).returning();
		const [city] = await db.insert(cities).values({
			countryId: country.id, nameEn: "Khartoum " + uuid, nameAr: "الخرطوم"
		}).returning();
		const [cat] = await db.insert(categories).values({
			nameEn: "Truck " + uuid, nameAr: "شاحنة", slug: "truck-" + uuid
		}).returning();

		const [listing] = await db.insert(listings).values({
			userId,
			categoryId: cat.id,
			countryId: country.id,
			cityId: city.id,
			title: "Truck for sale",
			description: "Heavy duty truck description 10+ chars",
			price: 50000,
			status: "available",
		}).returning();
		listingId = listing.id;
	});

	test("GET /packages returns active subscription packages and filters by roleTarget", async () => {
		// 1. Fetch all packages without auth (public)
		const resAll = await paymentsApp.request("/packages");
		expect(resAll.status).toBe(200);
		const pkgsAll = await resAll.json() as (typeof subscriptionPackages.$inferSelect)[];
		expect(Array.isArray(pkgsAll)).toBe(true);
		expect(pkgsAll.some(p => p.id === packageId)).toBe(true);

		// 2. Filter by valid roleTarget
		const resDealership = await paymentsApp.request("/packages?roleTarget=dealership");
		expect(resDealership.status).toBe(200);
		const pkgsDealership = await resDealership.json() as (typeof subscriptionPackages.$inferSelect)[];
		expect(pkgsDealership.every(p => p.roleTarget === "dealership")).toBe(true);

		// 3. Filter by roleTarget with no matching packages
		const resWorkshop = await paymentsApp.request("/packages?roleTarget=workshop");
		expect(resWorkshop.status).toBe(200);
		const pkgsWorkshop = await resWorkshop.json() as (typeof subscriptionPackages.$inferSelect)[];
		expect(pkgsWorkshop.some(p => p.id === packageId)).toBe(false);

		// 4. Invalid roleTarget -> 400
		const resInvalid = await paymentsApp.request("/packages?roleTarget=invalid_role");
		expect(resInvalid.status).toBe(400);
	});

	test("POST /checkout for subscription and featured listing with validation and ownership guards", async () => {
		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "subscription", packageId }),
		});
		expect(unauthRes.status).toBe(401);

		// Authenticated session
		getSession.mockResolvedValue({
			session: { id: "s_pay" },
			user: { id: userId, role: "user", accountType: "dealership" },
		});

		// 2. Subscription checkout without packageId -> 400
		const badSubRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "subscription" }),
		});
		expect(badSubRes.status).toBe(400);

		// 3. Subscription checkout with non-existent package -> 404
		const notFoundSubRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "subscription", packageId: "00000000-0000-0000-0000-000000000000" }),
		});
		expect(notFoundSubRes.status).toBe(404);

		// 4. Valid subscription checkout -> 201
		const subRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "subscription", packageId }),
		});
		expect(subRes.status).toBe(201);
		const subPayment = await subRes.json() as typeof payments.$inferSelect;
		expect(subPayment.purpose).toBe("subscription");
		expect(subPayment.status).toBe("pending");
		expect(subPayment.amount).toBe(100000);

		// 5. Featured listing checkout without listingId -> 400
		const badFeaturedRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "featured_listing" }),
		});
		expect(badFeaturedRes.status).toBe(400);

		// 6. Featured listing checkout with other user's listing -> 403
		getSession.mockResolvedValue({
			session: { id: "s_other" },
			user: { id: otherUserId, role: "user", accountType: "user" },
		});
		const forbiddenFeaturedRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "featured_listing", listingId }),
		});
		expect(forbiddenFeaturedRes.status).toBe(403);

		// 7. Valid featured listing checkout by owner -> 201
		getSession.mockResolvedValue({
			session: { id: "s_pay" },
			user: { id: userId, role: "user", accountType: "dealership" },
		});
		const featuredRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "featured_listing", listingId }),
		});
		expect(featuredRes.status).toBe(201);
		const featuredPayment = await featuredRes.json() as typeof payments.$inferSelect;
		expect(featuredPayment.purpose).toBe("featured_listing");
		expect(featuredPayment.status).toBe("pending");
		expect(featuredPayment.referenceId).toBe(listingId);
	});

	test("POST /:id/submit handles Bankak transaction submission with ownership & status guards", async () => {
		const [pendingPay] = await db.insert(payments).values({
			userId,
			amount: 50000,
			currency: "SDG",
			method: "bankak",
			status: "pending",
			purpose: "subscription",
			referenceId: packageId,
		}).returning();

		// 1. Unauthenticated -> 401
		getSession.mockResolvedValue(null);
		const unauthRes = await paymentsApp.request(`/${pendingPay.id}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ transactionId: "TXN123456" }),
		});
		expect(unauthRes.status).toBe(401);

		// 2. Missing transactionId -> 400
		getSession.mockResolvedValue({
			session: { id: "s_pay" },
			user: { id: userId, role: "user", accountType: "dealership" },
		});
		const badRes = await paymentsApp.request(`/${pendingPay.id}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		expect(badRes.status).toBe(400);

		// 3. Other user forbidden -> 403
		getSession.mockResolvedValue({
			session: { id: "s_other" },
			user: { id: otherUserId, role: "user", accountType: "user" },
		});
		const forbiddenRes = await paymentsApp.request(`/${pendingPay.id}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ transactionId: "TXN123456" }),
		});
		expect(forbiddenRes.status).toBe(403);

		// 4. Non-existent payment -> 404
		getSession.mockResolvedValue({
			session: { id: "s_pay" },
			user: { id: userId, role: "user", accountType: "dealership" },
		});
		const notFoundRes = await paymentsApp.request(`/00000000-0000-0000-0000-000000000000/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ transactionId: "TXN123456" }),
		});
		expect(notFoundRes.status).toBe(404);

		// 5. Valid transaction submission by owner -> 200
		const submitRes = await paymentsApp.request(`/${pendingPay.id}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ transactionId: "TXN123456" }),
		});
		expect(submitRes.status).toBe(200);
		const updatedPayment = await submitRes.json() as typeof payments.$inferSelect;
		expect(updatedPayment.transactionId).toBe("TXN123456");
	});

	test("POST /checkout enforces per-user rate limiting (429)", async () => {
		const rateLimitUserId = "pay_rl_" + crypto.randomUUID();
		await db.insert(user).values({
			id: rateLimitUserId, name: "RL User", email: `${rateLimitUserId}@e.com`, role: "user", accountType: "dealership"
		});

		getSession.mockResolvedValue({
			session: { id: "s_pay_rl" },
			user: { id: rateLimitUserId, role: "user", accountType: "dealership" },
		});

		// Send 15 checkouts (limit)
		for (let i = 0; i < 15; i++) {
			const res = await paymentsApp.request("/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ purpose: "subscription", packageId }),
			});
			expect(res.status).toBe(201);
		}

		// 16th checkout triggers 429
		const rateLimitedRes = await paymentsApp.request("/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ purpose: "subscription", packageId }),
		});
		expect(rateLimitedRes.status).toBe(429);
		const err = await rateLimitedRes.json() as { error: string; code: string };
		expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
	});
});
