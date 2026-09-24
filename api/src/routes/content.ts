import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { pageSlugParamSchema } from "../schemas";
import { handleAppError } from "../lib/errors";
import { contentService } from "../services/content.service";

export const contentApp = new Hono();

contentApp.onError(handleAppError);

// GET /api/content/banners
// Public endpoint for frontend to fetch active banners
contentApp.get("/banners", async (c) => {
	const activeBanners = await contentService.listActiveBanners();
	return c.json(activeBanners);
});

// GET /api/v1/content/pages
// Public endpoint for listing all published pages
contentApp.get("/pages", async (c) => {
	const activePages = await contentService.listActivePages();
	return c.json(activePages);
});

// GET /api/v1/content/pages/:slug
// Public endpoint for fetching page details by slug
contentApp.get("/pages/:slug", zValidator("param", pageSlugParamSchema), async (c) => {
	const { slug } = c.req.valid("param");
	const page = await contentService.getPageBySlug(slug);
	return c.json(page);
});
