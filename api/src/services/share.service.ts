import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { shareLinks } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { pages } from "../db/schemas/content-schema";
import { makes, models, cities } from "../db/schemas/taxonomy-schema";
import { BASE_URL, buildEntityUrl } from "../lib/url";
import { isBotUserAgent } from "../lib/bot-detection";
import {
	NotFoundError,
	GoneError,
	UnauthorizedError,
	ForbiddenError,
} from "../lib/errors";
import type { SessionUser } from "../middleware/auth";
import type { GenerateShareInput } from "../schemas";

export function generateShortCode(length = 7): string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	const randomBytes = crypto.getRandomValues(new Uint8Array(length));
	for (let i = 0; i < length; i++) {
		result += chars[randomBytes[i] % chars.length];
	}
	return result;
}

export const shareService = {
	async generateShareLink(
		input: GenerateShareInput,
		userId: string | null,
		locale: string,
	) {
		const { entityType, entityId, platform = "general" } = input;

		let targetUrl = "";
		let shareTitleEn = "";
		let shareTitleAr = "";
		let shareDescEn = "";
		let shareDescAr = "";
		const deepLink = `sayaratak://${entityType}/${entityId}`;

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

			if (!listing) {
				throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
			}
			if (listing.status !== "available") {
				throw new GoneError("Listing is no longer available", "LISTING_GONE");
			}

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
			const [dealer] = await db
				.select()
				.from(dealerships)
				.where(eq(dealerships.id, entityId));
			if (!dealer) {
				throw new NotFoundError("Dealership not found", "DEALERSHIP_NOT_FOUND");
			}

			targetUrl = buildEntityUrl("dealership", dealer.id, locale);
			shareTitleEn = `${dealer.name} - Verified Dealership`;
			shareTitleAr = `معرض ${dealer.name} للسيارات`;
			shareDescEn = `Check out available vehicles at ${dealer.name} on Sayaratak.`;
			shareDescAr = `استعرض أحدث السيارات المتاحة لدى معرض ${dealer.name} على منصة سياراتك.`;
		} else if (entityType === "workshop") {
			const [ws] = await db
				.select()
				.from(workshops)
				.where(eq(workshops.id, entityId));
			if (!ws) {
				throw new NotFoundError("Workshop not found", "WORKSHOP_NOT_FOUND");
			}

			targetUrl = buildEntityUrl("workshop", ws.id, locale);
			shareTitleEn = `${ws.name} - Auto Workshop`;
			shareTitleAr = `ورشة ${ws.name} لصيانة السيارات`;
			shareDescEn = `Automotive maintenance and repair services at ${ws.name} on Sayaratak.`;
			shareDescAr = `خدمات صيانة وإصلاح سيارات احترافية لدى ورشة ${ws.name} على سياراتك.`;
		} else if (entityType === "mechanic") {
			const [mech] = await db
				.select()
				.from(mechanics)
				.where(eq(mechanics.id, entityId));
			if (!mech) {
				throw new NotFoundError("Mechanic not found", "MECHANIC_NOT_FOUND");
			}

			targetUrl = buildEntityUrl("mechanic", mech.id, locale);
			shareTitleEn = `${mech.name} - Auto Specialist (${mech.specialization || "Automotive"})`;
			shareTitleAr = `${mech.name} - فني صيانة سيارات`;
			shareDescEn = `Certified mechanic ${mech.name} on Sayaratak.`;
			shareDescAr = `الفني المعتمد ${mech.name} على منصة سياراتك.`;
		} else if (entityType === "page") {
			const [pg] = await db
				.select()
				.from(pages)
				.where(eq(pages.slug, entityId));
			if (!pg || !pg.isActive) {
				throw new NotFoundError("Page not found", "PAGE_NOT_FOUND");
			}

			targetUrl = buildEntityUrl("page", pg.slug, locale);
			shareTitleEn = pg.title;
			shareTitleAr = pg.titleAr || pg.title;
			shareDescEn = "Sayaratak - Sudan's Automotive Marketplace";
			shareDescAr = "سياراتك - سوق السيارات الرائد في السودان";
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
				type: "copy_link_prompt",
				prompt:
					locale === "ar"
						? "تم نسخ الرابط! يمكنك الآن مشاركته في بايو تيك توك أو الرسائل المباشرة."
						: "Link copied! Share it in your TikTok bio, description, or direct messages.",
				url: shortUrl,
			},
			copy_link: shortUrl,
			general: shortUrl,
		};

		return {
			shortCode: code,
			shortUrl,
			deepLink,
			title: resolvedTitle,
			description: resolvedDesc,
			shareText: fullShareText,
			intents,
		};
	},

	async handleTrackedRedirect(code: string, userAgent = "") {
		const [link] = await db.select().from(shareLinks).where(eq(shareLinks.code, code));
		if (!link) return null;

		const isBot = isBotUserAgent(userAgent);

		if (isBot) {
			await db
				.update(shareLinks)
				.set({
					impressions: sql`${shareLinks.impressions} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(shareLinks.code, code));
		} else {
			await db
				.update(shareLinks)
				.set({
					clicks: sql`${shareLinks.clicks} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(shareLinks.code, code));

			if (link.targetType === "listing") {
				await db
					.update(listings)
					.set({ shareClickCount: sql`${listings.shareClickCount} + 1` })
					.where(eq(listings.id, link.targetId));
			}
		}

		const separator = link.targetUrl.includes("?") ? "&" : "?";
		return `${link.targetUrl}${separator}utm_source=${link.platform}&utm_medium=social_share&utm_campaign=${link.targetType}_share`;
	},

	async getLinkStats(code: string, user?: SessionUser) {
		const [link] = await db.select().from(shareLinks).where(eq(shareLinks.code, code));
		if (!link) {
			throw new NotFoundError("Short link not found", "LINK_NOT_FOUND");
		}

		if (link.userId) {
			if (!user) {
				throw new UnauthorizedError("Unauthorized", "UNAUTHORIZED");
			}
			if (link.userId !== user.id && user.role !== "admin") {
				throw new ForbiddenError("Forbidden", "FORBIDDEN");
			}
		}

		return {
			code: link.code,
			targetType: link.targetType,
			targetId: link.targetId,
			targetUrl: link.targetUrl,
			platform: link.platform,
			clicks: link.clicks,
			impressions: link.impressions,
			createdAt: link.createdAt,
		};
	},
};
