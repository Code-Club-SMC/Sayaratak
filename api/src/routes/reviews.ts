import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { reviews } from "../db/schemas/social-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { auth } from "../../lib/auth";
import { user } from "../db/schemas/auth-schema";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const reviewTargetMap = {
  dealershipId: dealerships,
  workshopId: workshops,
  mechanicId: mechanics,
} as const;

type ReviewTargetKey = keyof typeof reviewTargetMap;

const createReviewSchema = z.object({
	dealershipId: z.string().optional(),
	workshopId: z.string().optional(),
	mechanicId: z.string().optional(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().optional()
}).refine(data => data.dealershipId || data.workshopId || data.mechanicId, {
	message: "Target ID (dealership, workshop, or mechanic) is required"
});

const patchReplySchema = z.object({
	reply: z.string().min(1)
});

export const reviewsApp = new Hono();

// Helper to update the aggregated rating on the target profile
async function updateProfileRating(targetType: ReviewTargetKey, targetId: string, tx: any = db) {
  const [stats] = await tx.select({ count: sql<number>`count(*)`, avg: sql<number>`avg(${reviews.rating})` }).from(reviews).where(eq(reviews[targetType], targetId));
  const count = Number(stats.count) || 0;
  const avg = Math.round(Number(stats.avg) || 0);
  const table = reviewTargetMap[targetType];
  await tx.update(table as any).set({ ratingAvg: avg, ratingCount: count }).where(eq((table as any).id, targetId));
}

const getReviewsQuerySchema = z.object({
	dealershipId: z.string().optional(),
	workshopId: z.string().optional(),
	mechanicId: z.string().optional(),
	userId: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/reviews?dealershipId=... or workshopId=... or mechanicId=...
reviewsApp.get("/", zValidator("query", getReviewsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	
	const conditions = [];
	if (query.dealershipId) conditions.push(eq(reviews.dealershipId, query.dealershipId));
	if (query.workshopId) conditions.push(eq(reviews.workshopId, query.workshopId));
	if (query.mechanicId) conditions.push(eq(reviews.mechanicId, query.mechanicId));
	if (query.userId) conditions.push(eq(reviews.userId, query.userId));

	if (conditions.length === 0) {
		return c.json({ error: "Must provide a target ID to fetch reviews", code: "TARGET_ID_REQUIRED" }, 400);
	}

	const results = await db
		.select({
			review: {
				id: reviews.id,
				userId: reviews.userId,
				dealershipId: reviews.dealershipId,
				workshopId: reviews.workshopId,
				mechanicId: reviews.mechanicId,
				rating: reviews.rating,
				comment: reviews.comment,
				reply: reviews.reply,
				createdAt: reviews.createdAt,
				updatedAt: reviews.updatedAt,
			},
			user: {
				id: user.id,
				name: user.name,
				image: user.image,
			}
		})
		.from(reviews)
		.innerJoin(user, eq(reviews.userId, user.id))
		.where(and(...conditions))
		.orderBy(sql`${reviews.createdAt} DESC`)
		.limit(Number(query.limit) || 20);

	return c.json(results);
});

// POST /api/reviews
reviewsApp.post("/", zValidator("json", createReviewSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { dealershipId, workshopId, mechanicId, rating, comment } = c.req.valid("json");

	const targetType = dealershipId ? "dealershipId" : workshopId ? "workshopId" : "mechanicId";
	const targetId = (dealershipId || workshopId || mechanicId) as string;

	// Use a transaction to insert the review and update the profile average
	try {
		const created = await db.transaction(async (tx) => {
			const [newReview] = await tx
				.insert(reviews)
				.values({
					userId: session.user.id,
					dealershipId,
					workshopId,
					mechanicId,
					rating: Number(rating),
					comment,
				})
				.returning();

			await updateProfileRating(targetType as ReviewTargetKey, targetId, tx);
			return newReview;
		});

		return c.json({
			id: created.id,
			userId: created.userId,
			dealershipId: created.dealershipId,
			workshopId: created.workshopId,
			mechanicId: created.mechanicId,
			rating: created.rating,
			comment: created.comment,
			reply: created.reply,
			createdAt: created.createdAt,
			updatedAt: created.updatedAt,
		}, 201);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, 500);
	}
});

// PATCH /api/reviews/:id/reply (Owner only)
reviewsApp.patch("/:id/reply", zValidator("json", patchReplySchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const reviewId = c.req.param("id");
	const { reply } = c.req.valid("json");

	const [existingReview] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
	if (!existingReview) return c.json({ error: "Review not found", code: "REVIEW_NOT_FOUND" }, 404);

	// Verify the user owns the target profile
	const targetType = (existingReview.dealershipId ? "dealershipId" : existingReview.workshopId ? "workshopId" : "mechanicId") as ReviewTargetKey;
	const targetId = existingReview[targetType] as string;
	const table = reviewTargetMap[targetType];
	const [profile] = await db.select().from(table as any).where(eq((table as any).id, targetId));
	const isOwner = profile && profile.userId === session.user.id;

	if (!isOwner && session.user.role !== "admin") {
		return c.json({ error: "Forbidden: You don't own this profile", code: "FORBIDDEN" }, 403);
	}

	const [updated] = await db
		.update(reviews)
		.set({ reply, updatedAt: new Date() })
		.where(eq(reviews.id, reviewId))
		.returning();

	return c.json({
		id: updated.id,
		userId: updated.userId,
		dealershipId: updated.dealershipId,
		workshopId: updated.workshopId,
		mechanicId: updated.mechanicId,
		rating: updated.rating,
		comment: updated.comment,
		reply: updated.reply,
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	});
});
