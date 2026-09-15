import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { shareLinks } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { pages } from "../db/schemas/content-schema";
import { makes, models, cities } from "../db/schemas/taxonomy-schema";
import { auth } from "../../lib/auth";
import { BASE_URL, buildEntityUrl } from "../lib/url";
import { resolveLocale } from "../lib/i18n";

export const shareApp = new Hono();

import { isBotUserAgent } from "../lib/bot-detection";
import { createUserRateLimiter } from "../lib/rate-limiter";
export { isBotUserAgent };

// §6: Per-user rate limiting for share link generation (30 reqs/min)
const shareRateLimiter = createUserRateLimiter(30);

export function generateShortCode(length = 7): string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	const randomBytes = crypto.getRandomValues(new Uint8Array(length));
	for (let i = 0; i < length; i++) {
		result += chars[randomBytes[i] % chars.length];
	}
	return result;
}

const generateShareSchema = z.object({
	entityType: z.enum(["listing", "dealership", "workshop", "mechanic", "page"]),
	entityId: z.string().min(1),
	platform: z.enum(["whatsapp", "telegram", "facebook", "twitter", "tiktok", "copy_link", "general"]).optional(),
	locale: z.enum(["en", "ar"]).optional(),
});

// =============================================================
// 1. POST /api/v1/share/generate (Create/Fetch Short Link & Intents)
// =============================================================
shareApp.post("/generate", zValidator("json", generateShareSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	const userId = session?.user?.id || null;

	const rateKey = userId || c.req.header("x-forwarded-for") || "anonymous";
	if (!shareRateLimiter.check(rateKey)) {
		return c.json({ error: "Too Many Requests. Share generation limit exceeded.", code: "RATE_LIMIT_EXCEEDED" }, 429);
	}

	const { entityType, entityId, platform = "general", locale: bodyLocale } = c.req.valid("json");
	const locale = c.get('locale') || bodyLocale || resolveLocale(c.req);

	let targetUrl = "";
	let shareTitleEn = "";
	let shareTitleAr = "";
	let shareDescEn = "";
	let shareDescAr = "";
	let deepLink = `sayaratak://${entityType}/${entityId}`;

	// 1. Resolve Entity Details
	if (entityType === "listing") {
		const [listing] = await db
			.select({
				id: listings.id,
				title: listings.title,
				price: listings.price,
				currency: listings.currency,
				year: listings.year,
				status: listings.status,
				makeNameEn: makes.nameEn,
				makeNameAr: makes.nameAr,
				modelNameEn: models.nameEn,
				modelNameAr: models.nameAr,
				cityNameEn: cities.nameEn,
				cityNameAr: cities.nameAr,
			})
			.from(listings)
			.leftJoin(makes, eq(listings.makeId, makes.id))
			.leftJoin(models, eq(listings.modelId, models.id))
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.where(eq(listings.id, entityId));

		if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
		if (listing.status !== "available") return c.json({ error: "Listing is no longer available", code: "LISTING_GONE" }, 410);

		targetUrl = buildEntityUrl("listing", listing.id, locale);
		const makeName = listing.makeNameEn || "";
		const makeNameAr = listing.makeNameAr || "";
		const modelName = listing.modelNameEn || "";
		const modelNameAr = listing.modelNameAr || "";
		const yearStr = listing.year ? `${listing.year} ` : "";

		shareTitleEn = `${yearStr}${makeName} ${modelName} - ${listing.title}`;
		shareTitleAr = `${listing.year ? "موديل " + listing.year + " " : ""}${makeNameAr} ${modelNameAr} - ${listing.title}`;
		shareDescEn = `For sale on Sayaratak: ${listing.price} ${listing.currency} in ${listing.cityNameEn ?? "Sudan"}`;
		shareDescAr = `للبيع على منصة سياراتك: ${listing.price} ${listing.currency} في ${listing.cityNameAr ?? "السودان"}`;

		// Increment share intents created (Metric 1: Share button tap)
		await db
			.update(listings)
			.set({ shareCount: sql`${listings.shareCount} + 1` })
			.where(eq(listings.id, entityId));
	} else if (entityType === "dealership") {
		const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, entityId));
		if (!dealer) return c.json({ error: "Dealership not found", code: "DEALERSHIP_NOT_FOUND" }, 404);

		targetUrl = buildEntityUrl("dealership", dealer.id, locale);
		shareTitleEn = `${dealer.name} - Verified Dealership`;
		shareTitleAr = `معرض ${dealer.name} للسيارات`;
		shareDescEn = `Check out available vehicles at ${dealer.name} on Sayaratak.`;
		shareDescAr = `استعرض أحدث السيارات المتاحة لدى معرض ${dealer.name} على منصة سياراتك.`;
	} else if (entityType === "workshop") {
		const [ws] = await db.select().from(workshops).where(eq(workshops.id, entityId));
		if (!ws) return c.json({ error: "Workshop not found", code: "WORKSHOP_NOT_FOUND" }, 404);

		targetUrl = buildEntityUrl("workshop", ws.id, locale);
		shareTitleEn = `${ws.name} - Auto Workshop`;
		shareTitleAr = `ورشة ${ws.name} لصيانة السيارات`;
		shareDescEn = `Automotive maintenance and repair services at ${ws.name} on Sayaratak.`;
		shareDescAr = `خدمات صيانة وإصلاح سيارات احترافية لدى ورشة ${ws.name} على سياراتك.`;
	} else if (entityType === "mechanic") {
		const [mech] = await db.select().from(mechanics).where(eq(mechanics.id, entityId));
		if (!mech) return c.json({ error: "Mechanic not found", code: "MECHANIC_NOT_FOUND" }, 404);

		targetUrl = buildEntityUrl("mechanic", mech.id, locale);
		shareTitleEn = `${mech.name} - Auto Specialist (${mech.specialization || "Automotive"})`;
		shareTitleAr = `${mech.name} - فني صيانة سيارات`;
		shareDescEn = `Certified mechanic ${mech.name} on Sayaratak.`;
		shareDescAr = `الفني المعتمد ${mech.name} على منصة سياراتك.`;
	} else if (entityType === "page") {
		const [pg] = await db.select().from(pages).where(eq(pages.slug, entityId));
		if (!pg || !pg.isActive) return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);

		targetUrl = buildEntityUrl("page", pg.slug, locale);
		shareTitleEn = pg.title;
		shareTitleAr = pg.titleAr || pg.title;
		shareDescEn = `Sayaratak - Sudan's Automotive Marketplace`;
		shareDescAr = `سياراتك - سوق السيارات الرائد في السودان`;
	}

	// 2. Lookup existing short link or generate new one
	const existingConditions = [
		eq(shareLinks.targetType, entityType),
		eq(shareLinks.targetId, entityId),
		eq(shareLinks.platform, platform),
	];
	if (userId) existingConditions.push(eq(shareLinks.userId, userId));

	const [existing] = await db
		.select()
		.from(shareLinks)
		.where(and(...existingConditions));

	let code = existing?.code;

	if (!code) {
		code = generateShortCode();
		await db.insert(shareLinks).values({
			code,
			targetType: entityType,
			targetId: entityId,
			targetUrl,
			platform,
			userId,
		});
	}

	const shortUrl = `${BASE_URL}/s/${code}`;
	const resolvedTitle = locale === "ar" ? shareTitleAr : shareTitleEn;
	const resolvedDesc = locale === "ar" ? shareDescAr : shareDescEn;
	const fullShareText = `${resolvedTitle}\n${resolvedDesc}\n${shortUrl}`;

	// 3. Pre-formatted Platform Intents
	const intents = {
		whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`,
		telegram: `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(resolvedTitle)}`,
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`,
		twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(resolvedTitle)}`,
		tiktok: {
			type: "copy_link_prompt" as const,
			url: shortUrl,
			prompt: locale === "ar" ? "تم نسخ الرابط لمشاركته في تيك توك" : "Link ready to paste into TikTok",
		},
		copyLink: shortUrl,
	};

	return c.json({
		shortCode: code,
		shortUrl,
		deepLink,
		title: resolvedTitle,
		description: resolvedDesc,
		shareText: fullShareText,
		intents,
	});
});

// =============================================================
// 2. GET /api/v1/share/r/:code & /s/:code (Tracked Redirection)
// =============================================================
async function handleTrackedRedirect(c: any, code: string) {
	const userAgent = c.req.header("user-agent") || "";

	const [link] = await db.select().from(shareLinks).where(eq(shareLinks.code, code));

	if (!link) {
		return c.text("Short link not found or expired", 404);
	}

	const isBot = isBotUserAgent(userAgent);

	if (isBot) {
		// §2: Bot / Crawler pre-fetch -> Increment impressions ONLY
		await db
			.update(shareLinks)
			.set({
				impressions: sql`${shareLinks.impressions} + 1`,
				updatedAt: new Date(),
			})
			.where(eq(shareLinks.code, code));
	} else {
		// Human visitor -> Increment actual click counters
		await db
			.update(shareLinks)
			.set({
				clicks: sql`${shareLinks.clicks} + 1`,
				updatedAt: new Date(),
			})
			.where(eq(shareLinks.code, code));

		// Increment listing share click-throughs if target is listing
		if (link.targetType === "listing") {
			await db
				.update(listings)
				.set({ shareClickCount: sql`${listings.shareClickCount} + 1` })
				.where(eq(listings.id, link.targetId));
		}
	}

	// Construct destination URL with UTM tags
	const separator = link.targetUrl.includes("?") ? "&" : "?";
	const destinationUrl = `${link.targetUrl}${separator}utm_source=${link.platform}&utm_medium=social_share&utm_campaign=${link.targetType}_share`;

	return c.redirect(destinationUrl, 302);
}

shareApp.get("/r/:code", async (c) => {
	const code = c.req.param("code");
	return handleTrackedRedirect(c, code);
});

shareApp.get("/:code", async (c) => {
	const code = c.req.param("code");
	if (code === "generate" || code === "stats") return; // Handled by other routes
	return handleTrackedRedirect(c, code);
});

// =============================================================
// 3. GET /api/v1/share/stats/:code (Analytics query)
// =============================================================
shareApp.get("/stats/:code", async (c) => {
	const code = c.req.param("code");
	const [link] = await db.select().from(shareLinks).where(eq(shareLinks.code, code));

	if (!link) {
		return c.json({ error: "Short link not found", code: "LINK_NOT_FOUND" }, 404);
	}

	// Only the link creator or an admin can view stats for user-bound links
	if (link.userId) {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
		if (link.userId !== session.user.id && session.user.role !== "admin") {
			return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
		}
	}

	return c.json({
		code: link.code,
		targetType: link.targetType,
		targetId: link.targetId,
		targetUrl: link.targetUrl,
		platform: link.platform,
		clicks: link.clicks,
		impressions: link.impressions,
		createdAt: link.createdAt,
	});
});
