import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { favorites } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { NotFoundError, ConflictError } from "../lib/errors";
import type { GetFavoritesQuery } from "../schemas";

export const favoritesService = {
	async listFavorites(userId: string, query: GetFavoritesQuery) {
		const { page, limit } = query;
		const offset = (page - 1) * limit;

		return db
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
			.where(eq(favorites.userId, userId))
			.orderBy(sql`${favorites.createdAt} DESC`)
			.limit(limit)
			.offset(offset);
	},

	async addFavorite(userId: string, listingId: string) {
		const [listing] = await db
			.select({ id: listings.id })
			.from(listings)
			.where(eq(listings.id, listingId));

		if (!listing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		try {
			const favorite = await db.transaction(async (tx) => {
				const [created] = await tx
					.insert(favorites)
					.values({
						userId,
						listingId,
					})
					.returning();

				await tx
					.update(listings)
					.set({ favoriteCount: sql`${listings.favoriteCount} + 1` })
					.where(eq(listings.id, listingId));

				return created;
			});

			return {
				id: favorite.id,
				userId: favorite.userId,
				listingId: favorite.listingId,
				createdAt: favorite.createdAt,
			};
		} catch (error: any) {
			if (error.cause?.code === "23505" || error.code === "23505") {
				throw new ConflictError("Already favorited", "ALREADY_FAVORITED");
			}
			throw error;
		}
	},

	async removeFavorite(userId: string, listingId: string) {
		const deleted = await db.transaction(async (tx) => {
			const [removed] = await tx
				.delete(favorites)
				.where(
					and(
						eq(favorites.userId, userId),
						eq(favorites.listingId, listingId),
					),
				)
				.returning();

			if (!removed) return null;

			await tx
				.update(listings)
				.set({ favoriteCount: sql`GREATEST(${listings.favoriteCount} - 1, 0)` })
				.where(eq(listings.id, listingId));

			return removed;
		});

		if (!deleted) {
			throw new NotFoundError("Favorite not found", "FAVORITE_NOT_FOUND");
		}

		return { success: true, message: "Removed from favorites" };
	},
};
