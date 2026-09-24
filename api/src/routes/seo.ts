import { Hono } from "hono";
import { resolveLocale } from "../lib/i18n";
import { handleAppError } from "../lib/errors";
import { seoService } from "../services/seo.service";

export const seoApp = new Hono();

seoApp.onError(handleAppError);

export { invalidateSitemapCache } from "../services/seo.service";

// =============================================================
// 1. GET /api/v1/seo/metadata/:type/:identifier
// =============================================================
seoApp.get("/metadata/:type/:identifier", async (c) => {
	const type = c.req.param("type");
	const identifier = c.req.param("identifier");
	const locale = c.get("locale") || resolveLocale(c.req);

	const metadata = await seoService.getMetadata(type, identifier, locale);
	return c.json(metadata);
});

// =============================================================
// 2. GET /api/v1/seo/sitemap.xml
// =============================================================
seoApp.get("/sitemap.xml", async (c) => {
	const xml = await seoService.generateSitemapXml();
	c.header("Content-Type", "application/xml; charset=utf-8");
	c.header("Cache-Control", "public, max-age=3600");
	return c.body(xml);
});

// =============================================================
// 2A. GET /api/v1/seo/sitemap-index.xml
// =============================================================
seoApp.get("/sitemap-index.xml", async (c) => {
	const xml = await seoService.generateSitemapIndexXml();
	c.header("Content-Type", "application/xml; charset=utf-8");
	c.header("Cache-Control", "public, max-age=3600");
	return c.body(xml);
});

// =============================================================
// 2B. GET /api/v1/seo/sitemaps/:name
// =============================================================
seoApp.get("/sitemaps/:name", async (c) => {
	const name = c.req.param("name");
	const xml = await seoService.generateSubSitemapXml(name);
	if (!xml) {
		return c.text("Sitemap not found", 404);
	}
	c.header("Content-Type", "application/xml; charset=utf-8");
	c.header("Cache-Control", "public, max-age=3600");
	return c.body(xml);
});

// =============================================================
// 3. GET /api/v1/seo/robots.txt
// =============================================================
seoApp.get("/robots.txt", async (c) => {
	const robotsTxt = seoService.getRobotsTxt();
	c.header("Content-Type", "text/plain; charset=utf-8");
	c.header("Cache-Control", "public, max-age=86400");
	return c.text(robotsTxt);
});
