import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { reviews } from "../db/schemas/social-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { user } from "../db/schemas/auth-schema";
import { updateProfileRating, type ReviewTargetKey } from "../lib/reviews";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors";
import type { SessionUser } from "../middleware/auth";
import type { CreateReviewInput, GetReviewsQuery } from "../schemas";

export const reviewsService = {
	async listReviews(query: GetReviewsQuery) {
		const conditions = [];
		if (query.dealershipId) conditions.push(eq(reviews.dealershipId, query.dealershipId));
		if (query.workshopId) conditions.push(eq(reviews.workshopId, query.workshopId));
		if (query.mechanicId) conditions.push(eq(reviews.mechanicId, query.mechanicId));
		if (query.userId) conditions.push(eq(reviews.userId, query.userId));

		if (conditions.length === 0) {
			throw new BadRequestError(
				"Must provide a target ID to fetch reviews",
				"TARGET_ID_REQUIRED",
			);
		}

		return db
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
				},
			})
			.from(reviews)
			.innerJoin(user, eq(reviews.userId, user.id))
			.where(and(...conditions))
			.orderBy(sql`${reviews.createdAt} DESC`)
			.limit(Number(query.limit) || 20);
	},

	async createReview(userId: string, body: CreateReviewInput) {
		const { dealershipId, workshopId, mechanicId, rating, comment } = body;
		const targetType = dealershipId
			? "dealershipId"
			: workshopId
				? "workshopId"
				: "mechanicId";
		const targetId = (dealershipId || workshopId || mechanicId) as string;

		const created = await db.transaction(async (tx) => {
			const [newReview] = await tx
				.insert(reviews)
				.values({
					userId,
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

		return {
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
		};
	},

	async replyToReview(reviewId: string, currentUser: SessionUser, reply: string) {
		const [existingReview] = await db
			.select()
			.from(reviews)
			.where(eq(reviews.id, reviewId));

		if (!existingReview) {
			throw new NotFoundError("Review not found", "REVIEW_NOT_FOUND");
		}

		const targetType = (existingReview.dealershipId
			? "dealershipId"
			: existingReview.workshopId
				? "workshopId"
				: "mechanicId") as ReviewTargetKey;
		const targetId = existingReview[targetType] as string;

		let isOwner = false;
		if (targetType === "dealershipId") {
			const [profile] = await db
				.select({ userId: dealerships.userId })
				.from(dealerships)
				.where(eq(dealerships.id, targetId));
			isOwner = profile?.userId === currentUser.id;
		} else if (targetType === "workshopId") {
			const [profile] = await db
				.select({ userId: workshops.userId })
				.from(workshops)
				.where(eq(workshops.id, targetId));
			isOwner = profile?.userId === currentUser.id;
		} else if (targetType === "mechanicId") {
			const [profile] = await db
				.select({ userId: mechanics.userId })
				.from(mechanics)
				.where(eq(mechanics.id, targetId));
			isOwner = profile?.userId === currentUser.id;
		}

		if (!isOwner && currentUser.role !== "admin") {
			throw new ForbiddenError(
				"Forbidden: You don't own this profile",
				"FORBIDDEN",
			);
		}

		const [updated] = await db
			.update(reviews)
			.set({ reply, updatedAt: new Date() })
			.where(eq(reviews.id, reviewId))
			.returning();

		return {
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
		};
	},
};
