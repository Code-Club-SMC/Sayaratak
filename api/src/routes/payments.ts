import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { payments, subscriptionPackages } from "../db/schemas/monetization-schema";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createUserRateLimiter } from "../lib/rate-limiter";

export const paymentsApp = new Hono<{ Variables: { user: any } }>();

// §6: Per-user rate limiting for payment checkout (15 reqs/min)
const checkoutRateLimiter = createUserRateLimiter(15);

const getPackagesQuerySchema = z.object({
	roleTarget: z.enum(["dealership", "workshop", "mechanic", "user"]).optional(),
});

const checkoutSchema = z.object({
	purpose: z.enum(["subscription", "featured_listing"]),
	packageId: z.string().optional(),
	listingId: z.string().optional(),
});

const submitPaymentSchema = z.object({
	transactionId: z.string().min(1, "transactionId is required"),
});

// GET /api/v1/payments/packages
// Public endpoint: list active subscription packages for pricing page
paymentsApp.get("/packages", zValidator("query", getPackagesQuerySchema), async (c) => {
	const { roleTarget } = c.req.valid("query");

	const conditions = [eq(subscriptionPackages.isActive, true)];
	if (roleTarget) {
		conditions.push(eq(subscriptionPackages.roleTarget, roleTarget));
	}

	const pkgs = await db
		.select({
			id: subscriptionPackages.id,
			nameEn: subscriptionPackages.nameEn,
			nameAr: subscriptionPackages.nameAr,
			roleTarget: subscriptionPackages.roleTarget,
			price: subscriptionPackages.price,
			currency: subscriptionPackages.currency,
			durationDays: subscriptionPackages.durationDays,
			listingLimit: subscriptionPackages.listingLimit,
			isFeaturedIncluded: subscriptionPackages.isFeaturedIncluded,
			isActive: subscriptionPackages.isActive,
		})
		.from(subscriptionPackages)
		.where(and(...conditions));

	return c.json(pkgs);
});

// POST /api/payments/checkout
// Create a pending payment intent
paymentsApp.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	if (!checkoutRateLimiter.check(session.user.id)) {
		return c.json({ error: "Too Many Requests. Checkout rate limit exceeded.", code: "RATE_LIMIT_EXCEEDED" }, 429);
	}

	const body = c.req.valid("json");
	
	if (body.purpose === "subscription") {
		if (!body.packageId) return c.json({ error: "packageId required for subscription checkout", code: "PACKAGE_ID_REQUIRED" }, 400);
		
		const [pkg] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, body.packageId));
		if (!pkg) return c.json({ error: "Package not found", code: "PACKAGE_NOT_FOUND" }, 404);

		const [payment] = await db.insert(payments).values({
			userId: session.user.id,
			amount: pkg.price,
			currency: pkg.currency,
			method: "bankak",
			status: "pending",
			purpose: "subscription",
			referenceId: pkg.id,
		}).returning();

		return c.json({
			id: payment.id,
			amount: payment.amount,
			currency: payment.currency,
			method: payment.method,
			status: payment.status,
			purpose: payment.purpose,
			referenceId: payment.referenceId,
			createdAt: payment.createdAt,
		}, 201);
	}

	if (body.purpose === "featured_listing") {
		if (!body.listingId) return c.json({ error: "listingId required for featured listing checkout", code: "LISTING_ID_REQUIRED" }, 400);

		const [listing] = await db.select().from(listings).where(eq(listings.id, body.listingId));
		if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
		if (listing.userId !== session.user.id && session.user.role !== "admin") {
			return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
		}

		const featuredPrice = 5000;
		const [payment] = await db.insert(payments).values({
			userId: session.user.id,
			amount: featuredPrice,
			currency: "SDG",
			method: "bankak",
			status: "pending",
			purpose: "featured_listing",
			referenceId: listing.id,
		}).returning();

		return c.json({
			id: payment.id,
			amount: payment.amount,
			currency: payment.currency,
			method: payment.method,
			status: payment.status,
			purpose: payment.purpose,
			referenceId: payment.referenceId,
			createdAt: payment.createdAt,
		}, 201);
	}

	return c.json({ error: "Invalid purpose", code: "INVALID_PURPOSE" }, 400);
});

// POST /api/payments/:id/submit
// Submit the Bankak transaction ID for manual verification
paymentsApp.post("/:id/submit", zValidator("json", submitPaymentSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const { transactionId } = c.req.valid("json");

	const [existing] = await db.select().from(payments).where(eq(payments.id, id));
	if (!existing) return c.json({ error: "Payment not found", code: "PAYMENT_NOT_FOUND" }, 404);
	if (existing.userId !== session.user.id) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	if (existing.status !== "pending") return c.json({ error: "Payment is not pending", code: "PAYMENT_NOT_PENDING" }, 400);

	const [updated] = await db.update(payments).set({
		transactionId,
		updatedAt: new Date(),
	}).where(eq(payments.id, id)).returning();

	return c.json({
		id: updated.id,
		amount: updated.amount,
		currency: updated.currency,
		method: updated.method,
		status: updated.status,
		purpose: updated.purpose,
		transactionId: updated.transactionId,
		referenceId: updated.referenceId,
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	});
});
