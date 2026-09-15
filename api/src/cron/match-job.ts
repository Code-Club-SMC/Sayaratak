import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { savedSearches } from "../db/schemas/social-schema";
import { notifications } from "../db/schemas/communication-schema";
import { sendPushNotification } from "../lib/fcm";
import { gt, and, eq } from "drizzle-orm";

export async function runMatchJob(executionTime = new Date()) {
	console.log("[Cron] Running saved searches match job...");
	try {
		// Get all active saved searches
		const allSearches = await db.select().from(savedSearches);
		if (allSearches.length === 0) return;

		// Default fallback threshold: 24 hours ago
		const defaultThreshold = new Date(executionTime.getTime() - 24 * 60 * 60 * 1000);

		// Determine the earliest watermark among all saved searches to bound the DB query
		let oldestSince = executionTime;
		for (const search of allSearches) {
			const since = search.lastNotifiedAt ?? search.createdAt ?? defaultThreshold;
			if (since < oldestSince) {
				oldestSince = since;
			}
		}

		// Query listings created after the oldest watermark
		const newListings = await db
			.select()
			.from(listings)
			.where(and(eq(listings.status, "available"), gt(listings.createdAt, oldestSince)));

		if (newListings.length === 0) {
			// Update lastNotifiedAt to executionTime to advance watermark even if no new listings
			for (const search of allSearches) {
				if (!search.lastNotifiedAt || search.lastNotifiedAt < executionTime) {
					await db
						.update(savedSearches)
						.set({ lastNotifiedAt: executionTime })
						.where(eq(savedSearches.id, search.id));
				}
			}
			return;
		}

		for (const search of allSearches) {
			const since = search.lastNotifiedAt ?? search.createdAt ?? defaultThreshold;
			const filters = search.filters;

			const matches = newListings.filter((listing) => {
				// Only match listings created strictly after this search's last watermark
				if (listing.createdAt <= since) return false;

				if (filters.makeId && listing.makeId !== filters.makeId) return false;
				if (filters.modelId && listing.modelId !== filters.modelId) return false;
				if (filters.categoryId && listing.categoryId !== filters.categoryId) return false;
				if (filters.minPrice && listing.price < filters.minPrice) return false;
				if (filters.maxPrice && listing.price > filters.maxPrice) return false;
				if (filters.minYear && listing.year && listing.year < filters.minYear) return false;
				if (filters.maxYear && listing.year && listing.year > filters.maxYear) return false;
				if (filters.transmission && listing.transmission !== filters.transmission) return false;
				return true;
			});

			if (matches.length > 0) {
				// Insert Notification
				await db.insert(notifications).values({
					userId: search.userId,
					title: `New Matches for ${search.title}`,
					body: `We found ${matches.length} new vehicles matching your saved search!`,
					type: "match",
					referenceId: search.id,
				});

				// Send Push Notification
				await sendPushNotification(
					search.userId,
					`New Matches for ${search.title}`,
					`We found ${matches.length} new vehicles matching your saved search!`,
					{ type: "match", searchId: search.id }
				);

				console.log(
					`[Cron] Matched ${matches.length} listings for search "${search.title}" (User: ${search.userId})`
				);
			}

			// Update lastNotifiedAt per search to ensure idempotency across overlapping runs/restarts
			await db
				.update(savedSearches)
				.set({ lastNotifiedAt: executionTime })
				.where(eq(savedSearches.id, search.id));
		}
	} catch (error) {
		console.error("[Cron] Match job failed:", error);
	}
}

import { withAdvisoryLock } from "./advisory-lock";

export function startMatchJob() {
	// Run every 15 minutes
	Bun.cron("*/15 * * * *", async () => {
		await withAdvisoryLock(1001, "saved-search-match", async () => {
			await runMatchJob();
		});
	});
}
