import { Hono } from "hono";
import { eq, and, lte, gte } from "drizzle-orm";
import { db } from "../db";
import { banners, pages } from "../db/schemas/content-schema";

export const contentApp = new Hono();

// GET /api/content/banners
// Public endpoint for frontend to fetch active banners
contentApp.get("/banners", async (c) => {
	const now = new Date();
	
	const activeBanners = await db
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
				gte(banners.endDate, now)
			)
		);

	return c.json(activeBanners);
});

// GET /api/v1/content/pages
// Public endpoint for listing all published pages
contentApp.get("/pages", async (c) => {
	const activePages = await db
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

	return c.json(activePages);
});

// GET /api/v1/content/pages/:slug
// Public endpoint for fetching page details by slug
contentApp.get("/pages/:slug", async (c) => {
	const slug = c.req.param("slug");

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
		return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);
	}

	return c.json(page);
});

