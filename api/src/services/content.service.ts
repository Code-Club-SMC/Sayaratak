import { eq, and, lte, gte } from "drizzle-orm";
import { db } from "../db";
import { banners, pages } from "../db/schemas/content-schema";
import { NotFoundError } from "../lib/errors";

export const contentService = {
	async listActiveBanners() {
		const now = new Date();
		return db
			.select({
				id: banners.id,
				title: banners.title,
				imageUrl: banners.imageUrl,
				targetUrl: banners.targetUrl,
				placement: banners.placement,
				startDate: banners.startDate,
				endDate: banners.endDate,
				isActive: banners.isActive,
			})
			.from(banners)
			.where(
				and(
					eq(banners.isActive, true),
					lte(banners.startDate, now),
					gte(banners.endDate, now),
				),
			);
	},

	async listActivePages() {
		return db
			.select({
				id: pages.id,
				slug: pages.slug,
				title: pages.title,
				titleAr: pages.titleAr,
				createdAt: pages.createdAt,
				updatedAt: pages.updatedAt,
			})
			.from(pages)
			.where(eq(pages.isActive, true));
	},

	async getPageBySlug(slug: string) {
		const [page] = await db
			.select({
				id: pages.id,
				slug: pages.slug,
				title: pages.title,
				titleAr: pages.titleAr,
				content: pages.content,
				contentAr: pages.contentAr,
				isActive: pages.isActive,
				createdAt: pages.createdAt,
				updatedAt: pages.updatedAt,
			})
			.from(pages)
			.where(and(eq(pages.slug, slug), eq(pages.isActive, true)));

		if (!page) {
			throw new NotFoundError("Page not found", "PAGE_NOT_FOUND");
		}

		return page;
	},
};
