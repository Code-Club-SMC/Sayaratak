import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { favorites } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const favoritesApp = new Hono();

const getFavoritesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/favorites
favoritesApp.get("/", zValidator("query", getFavoritesQuerySchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	// Get favorites joined with the listing details
	const results = await db
		.select({
			favoriteId: favorites.id,
			createdAt: favorites.createdAt,
			listing: {
				id: listings.id,
				userId: listings.userId,
				categoryId: listings.categoryId,
				makeId: listings.makeId,
				modelId: listings.modelId,
				countryId: listings.countryId,
				cityId: listings.cityId,
				districtId: listings.districtId,
				title: listings.title,
				description: listings.description,
				price: listings.price,
				currency: listings.currency,
				rentalPeriod: listings.rentalPeriod,
				status: listings.status,
				lat: listings.lat,
				lng: listings.lng,
				isFeatured: listings.isFeatured,
				year: listings.year,
				mileage: listings.mileage,
				transmission: listings.transmission,
				fuelType: listings.fuelType,
				condition: listings.condition,
				viewCount: listings.viewCount,
				phoneClickCount: listings.phoneClickCount,
				whatsappClickCount: listings.whatsappClickCount,
				favoriteCount: listings.favoriteCount,
				shareCount: listings.shareCount,
				shareClickCount: listings.shareClickCount,
				specs: listings.specs,
				media: listings.media,
				createdAt: listings.createdAt,
				updatedAt: listings.updatedAt,
			},
		})
		.from(favorites)
		.innerJoin(listings, eq(favorites.listingId, listings.id))
		.where(eq(favorites.userId, session.user.id))
		.orderBy(sql`${favorites.createdAt} DESC`)
		.limit(limit)
		.offset(offset);

	return c.json(results);
});

// POST /api/favorites/:listingId
favoritesApp.post("/:listingId", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const listingId = c.req.param("listingId");

	// Check if listing exists
	const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId));
	if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);

	try {
		const [favorite] = await db
			.insert(favorites)
			.values({
				userId: session.user.id,
				listingId,
			})
			.returning();

		await db.update(listings).set({ favoriteCount: sql`${listings.favoriteCount} + 1` }).where(eq(listings.id, listingId));

		return c.json({
			id: favorite.id,
			userId: favorite.userId,
			listingId: favorite.listingId,
			createdAt: favorite.createdAt,
		}, 201);
	} catch (error: any) {
		// Handle unique constraint violation (already favorited)
		if (error.cause?.code === "23505" || error.code === "23505") {
			return c.json({ error: "Already favorited", code: "ALREADY_FAVORITED" }, 409);
		}
		return c.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, 500);
	}
});

// DELETE /api/favorites/:listingId
favoritesApp.delete("/:listingId", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const listingId = c.req.param("listingId");

	const [deleted] = await db
		.delete(favorites)
		.where(
			and(
				eq(favorites.userId, session.user.id),
				eq(favorites.listingId, listingId)
			)
		)
		.returning();

	if (!deleted) return c.json({ error: "Favorite not found", code: "FAVORITE_NOT_FOUND" }, 404);

	await db.update(listings).set({ favoriteCount: sql`${listings.favoriteCount} - 1` }).where(eq(listings.id, listingId));

	return c.json({ success: true, message: "Removed from favorites" });
});
