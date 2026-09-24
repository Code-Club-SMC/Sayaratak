import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { savedSearches } from "../db/schemas/social-schema";
import { NotFoundError } from "../lib/errors";
import type { CreateSavedSearchInput } from "../schemas";

export const savedSearchesService = {
	async listSavedSearches(userId: string) {
		return db
			.select({
				id: savedSearches.id,
				userId: savedSearches.userId,
				title: savedSearches.title,
				filters: savedSearches.filters,
				createdAt: savedSearches.createdAt,
			})
			.from(savedSearches)
			.where(eq(savedSearches.userId, userId))
			.orderBy(desc(savedSearches.createdAt));
	},

	async createSavedSearch(userId: string, body: CreateSavedSearchInput) {
		const [created] = await db
			.insert(savedSearches)
			.values({
				userId,
				title: body.title,
				filters: body.filters,
			})
			.returning();

		return created;
	},

	async deleteSavedSearch(id: string, userId: string) {
		const [deleted] = await db
			.delete(savedSearches)
			.where(
				and(
					eq(savedSearches.id, id),
					eq(savedSearches.userId, userId),
				),
			)
			.returning();

		if (!deleted) {
			throw new NotFoundError("Saved search not found", "NOT_FOUND");
		}

		return { success: true, message: "Saved search deleted" };
	},
};
