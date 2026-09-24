import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { reviews } from "../db/schemas/social-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";

export const reviewTargetMap = {
	dealershipId: dealerships,
	workshopId: workshops,
	mechanicId: mechanics,
} as const;

export type ReviewTargetKey = keyof typeof reviewTargetMap;

/**
 * Updates the aggregated rating on the target profile
 */
export async function updateProfileRating(
	targetType: ReviewTargetKey,
	targetId: string,
	tx: any = db
): Promise<void> {
	const [stats] = await tx
		.select({
			count: sql<number>`count(*)`,
			avg: sql<number>`avg(${reviews.rating})`,
		})
		.from(reviews)
		.where(eq(reviews[targetType], targetId));

	const count = Number(stats.count) || 0;
	const avg = Math.round(Number(stats.avg) || 0);
	if (targetType === "dealershipId") {
		await tx
			.update(dealerships)
			.set({ ratingAvg: avg, ratingCount: count })
			.where(eq(dealerships.id, targetId));
	} else if (targetType === "workshopId") {
		await tx
			.update(workshops)
			.set({ ratingAvg: avg, ratingCount: count })
			.where(eq(workshops.id, targetId));
	} else if (targetType === "mechanicId") {
		await tx
			.update(mechanics)
			.set({ ratingAvg: avg, ratingCount: count })
			.where(eq(mechanics.id, targetId));
	}
}
