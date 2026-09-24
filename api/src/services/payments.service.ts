import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { payments, subscriptionPackages } from "../db/schemas/monetization-schema";
import { listings } from "../db/schemas/listing-schema";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors";
import type { SessionUser } from "../middleware/auth";
import type { CheckoutInput } from "../schemas";

export const paymentsService = {
	async listPackages(roleTarget?: string) {
		const conditions = [eq(subscriptionPackages.isActive, true)];
		if (roleTarget) {
			conditions.push(eq(subscriptionPackages.roleTarget, roleTarget));
		}

		return db
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
	},

	async createCheckout(user: SessionUser, body: CheckoutInput) {
		if (body.purpose === "subscription") {
			if (!body.packageId) {
				throw new BadRequestError(
					"packageId required for subscription checkout",
					"PACKAGE_ID_REQUIRED",
				);
			}

			const [pkg] = await db
				.select()
				.from(subscriptionPackages)
				.where(eq(subscriptionPackages.id, body.packageId));
			if (!pkg) {
				throw new NotFoundError("Package not found", "PACKAGE_NOT_FOUND");
			}

			const [payment] = await db
				.insert(payments)
				.values({
					userId: user.id,
					amount: pkg.price,
					currency: pkg.currency,
					method: "bankak",
					status: "pending",
					purpose: "subscription",
					referenceId: pkg.id,
				})
				.returning();

			return {
				id: payment.id,
				amount: payment.amount,
				currency: payment.currency,
				method: payment.method,
				status: payment.status,
				purpose: payment.purpose,
				referenceId: payment.referenceId,
				createdAt: payment.createdAt,
			};
		}

		if (body.purpose === "featured_listing") {
			if (!body.listingId) {
				throw new BadRequestError(
					"listingId required for featured listing checkout",
					"LISTING_ID_REQUIRED",
				);
			}

			const [listing] = await db
				.select()
				.from(listings)
				.where(eq(listings.id, body.listingId));
			if (!listing) {
				throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
			}
			if (listing.userId !== user.id && user.role !== "admin") {
				throw new ForbiddenError("Forbidden", "FORBIDDEN");
			}

			const featuredPrice = 5000;
			const [payment] = await db
				.insert(payments)
				.values({
					userId: user.id,
					amount: featuredPrice,
					currency: "SDG",
					method: "bankak",
					status: "pending",
					purpose: "featured_listing",
					referenceId: listing.id,
				})
				.returning();

			return {
				id: payment.id,
				amount: payment.amount,
				currency: payment.currency,
				method: payment.method,
				status: payment.status,
				purpose: payment.purpose,
				referenceId: payment.referenceId,
				createdAt: payment.createdAt,
			};
		}

		throw new BadRequestError("Invalid purpose", "INVALID_PURPOSE");
	},

	async submitPayment(id: string, user: SessionUser, transactionId: string) {
		const [existing] = await db.select().from(payments).where(eq(payments.id, id));
		if (!existing) {
			throw new NotFoundError("Payment not found", "PAYMENT_NOT_FOUND");
		}
		if (existing.userId !== user.id) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}
		if (existing.status !== "pending") {
			throw new BadRequestError("Payment is not pending", "PAYMENT_NOT_PENDING");
		}

		const [updated] = await db
			.update(payments)
			.set({
				transactionId,
				updatedAt: new Date(),
			})
			.where(eq(payments.id, id))
			.returning();

		return {
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
		};
	},
};
