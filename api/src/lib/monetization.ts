import { eq, and, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { subscriptionPackages, userSubscriptions } from "../db/schemas/monetization-schema";
import { listings } from "../db/schemas/listing-schema";
import { AccountType } from "./profiles";

/**
 * Enrolls a newly registered user in the Free Plan automatically.
 */
export async function enrollInFreePlan(userId: string, accountType: AccountType) {
	const [freePlan] = await db
		.select()
		.from(subscriptionPackages)
		.where(eq(subscriptionPackages.nameEn, "Free Plan"))
		.limit(1);

	if (!freePlan) {
		console.error("Free Plan package not found in database. Did you run the seed script?");
		return;
	}

	// Calculate end date (100 years from now basically)
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + freePlan.durationDays);

	await db.insert(userSubscriptions).values({
		userId,
		packageId: freePlan.id,
		status: "active",
		startDate: new Date(),
		endDate,
	});
}

/**
 * Checks if a user has reached their maximum listing limit based on their active subscription.
 * Returns true if they can post, false if they are blocked.
 */
export async function checkListingLimit(userId: string): Promise<boolean> {
	const activeSubs = await db
		.select({
			limit: subscriptionPackages.listingLimit,
		})
		.from(userSubscriptions)
		.innerJoin(subscriptionPackages, eq(userSubscriptions.packageId, subscriptionPackages.id))
		.where(
			and(
				eq(userSubscriptions.userId, userId),
				eq(userSubscriptions.status, "active"),
				gt(userSubscriptions.endDate, new Date())
			)
		);

	if (activeSubs.length === 0) {
		return false; // No active subscription at all
	}

	// Find the max limit among active subscriptions
	let maxLimit = 0;
	for (const sub of activeSubs) {
		if (sub.limit === 0) return true; // 0 means unlimited in our schema
		if (sub.limit > maxLimit) maxLimit = sub.limit;
	}

	// Count user's active listings
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(listings)
		.where(and(eq(listings.userId, userId), eq(listings.status, "available")));

	const activeListingCount = result?.count || 0;

	return activeListingCount < maxLimit;
}
