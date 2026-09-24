import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { reviewsService } from "../services/reviews.service";
import {
	createReviewSchema,
	patchReplySchema,
	getReviewsQuerySchema,
	idParamSchema,
} from "../schemas";

export const reviewsApp = new Hono<{ Variables: { user: SessionUser } }>();

reviewsApp.onError(handleAppError);

// GET /api/reviews?dealershipId=... or workshopId=... or mechanicId=...
reviewsApp.get("/", zValidator("query", getReviewsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	const results = await reviewsService.listReviews(query);
	return c.json(results);
});

// POST /api/reviews
reviewsApp.post("/", requireAuth(), zValidator("json", createReviewSchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const created = await reviewsService.createReview(user.id, body);
	return c.json(created, 201);
});

// PATCH /api/reviews/:id/reply (Owner only)
reviewsApp.patch(
	"/:id/reply",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", patchReplySchema),
	async (c) => {
		const user = c.get("user");
		const { id: reviewId } = c.req.valid("param");
		const { reply } = c.req.valid("json");
		const updated = await reviewsService.replyToReview(reviewId, user, reply);
		return c.json(updated);
	},
);
