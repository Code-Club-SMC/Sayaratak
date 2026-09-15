import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { shareApp, isBotUserAgent } from "../src/routes/share";
import { db } from "../src/db";
import { listings } from "../src/db/schemas/listing-schema";
import { shareLinks } from "../src/db/schemas/social-schema";
import { user } from "../src/db/schemas/auth-schema";
import { categories, makes, models, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { eq } from "drizzle-orm";

let testUserId: string;
let testCountryId: string;
let testCityId: string;
let testCategoryId: string;
let testMakeId: string;
let testModelId: string;
let activeListingId: string;

beforeAll(async () => {
	const uuid = crypto.randomUUID().slice(0, 8);
	testUserId = "user_share_" + uuid;

	await db.insert(user).values({
		id: testUserId,
		name: "Share Test User",
		email: `${testUserId}@sayaratak.com`,
		role: "user",
		accountType: "user",
	});

	const [country] = await db
		.insert(countries)
		.values({
			nameEn: "Sudan Share " + uuid,
			nameAr: "السودان",
			code: "S" + uuid.slice(0, 1).toUpperCase(),
		})
		.returning();
	testCountryId = country.id;

	const [city] = await db
		.insert(cities)
		.values({
			countryId: testCountryId,
			nameEn: "Khartoum Share",
			nameAr: "الخرطوم",
		})
		.returning();
	testCityId = city.id;

	const [cat] = await db
		.insert(categories)
		.values({
			nameEn: "Cars Share",
			nameAr: "سيارات",
			slug: "cars-share-" + uuid,
		})
		.returning();
	testCategoryId = cat.id;

	const [mk] = await db
		.insert(makes)
		.values({
			nameEn: "Hyundai",
			nameAr: "هيونداي",
			slug: "hyundai-share-" + uuid,
		})
		.returning();
	testMakeId = mk.id;

	const [md] = await db
		.insert(models)
		.values({
			makeId: testMakeId,
			nameEn: "Elantra",
			nameAr: "النترا",
			slug: "elantra-share-" + uuid,
		})
		.returning();
	testModelId = md.id;

	const [listing] = await db
		.insert(listings)
		.values({
			userId: testUserId,
			categoryId: testCategoryId,
			makeId: testMakeId,
			modelId: testModelId,
			countryId: testCountryId,
			cityId: testCityId,
			title: "2022 Hyundai Elantra Limited",
			description: "Immaculate condition, full options, single owner.",
			price: 18000000,
			currency: "SDG",
			year: 2022,
			status: "available",
		})
		.returning();
	activeListingId = listing.id;
});

afterAll(async () => {
	await db.delete(shareLinks).where(eq(shareLinks.targetId, activeListingId));
	await db.delete(listings).where(eq(listings.id, activeListingId));
	await db.delete(models).where(eq(models.id, testModelId));
	await db.delete(makes).where(eq(makes.id, testMakeId));
	await db.delete(categories).where(eq(categories.id, testCategoryId));
	await db.delete(cities).where(eq(cities.id, testCityId));
	await db.delete(countries).where(eq(countries.id, testCountryId));
	await db.delete(user).where(eq(user.id, testUserId));
});

describe("Deep-Linking & Social Share API Verification", () => {
	let generatedShortCode: string;

	test("1. POST /api/v1/share/generate builds pre-formatted intents and increments shareCount", async () => {
		const [initialListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));
		const initialShareCount = initialListing.shareCount;

		const res = await shareApp.request("/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				entityType: "listing",
				entityId: activeListingId,
				platform: "whatsapp",
				locale: "en",
			}),
		});

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.shortCode).toBeDefined();
		generatedShortCode = data.shortCode;
		expect(data.shortUrl).toContain(`/s/${data.shortCode}`);
		expect(data.deepLink).toBe(`sayaratak://listing/${activeListingId}`);

		// WhatsApp intent includes text and shortUrl
		expect(data.intents.whatsapp).toContain("https://api.whatsapp.com/send?text=");
		expect(data.intents.telegram).toContain("https://t.me/share/url?url=");
		expect(data.intents.facebook).toContain("https://www.facebook.com/sharer/sharer.php?u=");
		expect(data.intents.twitter).toContain("https://twitter.com/intent/tweet?url=");

		// TikTok is copy_link_prompt (not broken web intent)
		expect(data.intents.tiktok.type).toBe("copy_link_prompt");
		expect(data.intents.tiktok.url).toBe(data.shortUrl);

		// Metric 1: shareCount incremented (share intent created)
		const [updatedListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));
		expect(updatedListing.shareCount).toBe(initialShareCount + 1);
	});

	test("2. Localized share text generation for Arabic (?locale=ar)", async () => {
		const res = await shareApp.request("/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				entityType: "listing",
				entityId: activeListingId,
				platform: "telegram",
				locale: "ar",
			}),
		});

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.title).toContain("هيونداي");
		expect(data.title).toContain("النترا");
		expect(data.description).toContain("للبيع على منصة سياراتك");
		expect(data.intents.tiktok.prompt).toContain("تم نسخ الرابط");
	});

	test("3. Human visit to /r/:code increments clicks & shareClickCount and redirects 302 with UTM tags", async () => {
		const [beforeLink] = await db.select().from(shareLinks).where(eq(shareLinks.code, generatedShortCode));
		const [beforeListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));

		const initialClicks = beforeLink.clicks;
		const initialShareClickCount = beforeListing.shareClickCount;

		// Regular human browser (Chrome user agent)
		const res = await shareApp.request(`/r/${generatedShortCode}`, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});

		expect(res.status).toBe(302);
		const redirectLocation = res.headers.get("Location") || "";

		expect(redirectLocation).toContain(`/listings/${activeListingId}`);
		expect(redirectLocation).toContain("utm_source=whatsapp");
		expect(redirectLocation).toContain("utm_medium=social_share");
		expect(redirectLocation).toContain("utm_campaign=listing_share");

		// Metric 2: clicks and shareClickCount incremented for human visitor
		const [afterLink] = await db.select().from(shareLinks).where(eq(shareLinks.code, generatedShortCode));
		const [afterListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));

		expect(afterLink.clicks).toBe(initialClicks + 1);
		expect(afterLink.impressions).toBe(beforeLink.impressions); // impressions untouched
		expect(afterListing.shareClickCount).toBe(initialShareClickCount + 1);
	});

	test("4. Bot/Crawler unfurl increments impressions ONLY and does NOT inflate human click counts", async () => {
		const [beforeLink] = await db.select().from(shareLinks).where(eq(shareLinks.code, generatedShortCode));
		const [beforeListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));

		// WhatsApp link-preview bot
		const resWhatsAppBot = await shareApp.request(`/r/${generatedShortCode}`, {
			headers: {
				"User-Agent": "WhatsApp/2.21.12.21 N",
			},
		});

		expect(resWhatsAppBot.status).toBe(302);

		// Facebook OpenGraph scraper bot
		const resFacebookBot = await shareApp.request(`/r/${generatedShortCode}`, {
			headers: {
				"User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
			},
		});

		expect(resFacebookBot.status).toBe(302);

		const [afterLink] = await db.select().from(shareLinks).where(eq(shareLinks.code, generatedShortCode));
		const [afterListing] = await db.select().from(listings).where(eq(listings.id, activeListingId));

		// Impressions incremented by 2
		expect(afterLink.impressions).toBe(beforeLink.impressions + 2);

		// Human clicks & shareClickCount stayed EXACTLY the same (no inflation!)
		expect(afterLink.clicks).toBe(beforeLink.clicks);
		expect(afterListing.shareClickCount).toBe(beforeListing.shareClickCount);
	});

	test("5. GET /api/v1/share/stats/:code returns accurate click & impression metrics", async () => {
		const res = await shareApp.request(`/stats/${generatedShortCode}`);
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.code).toBe(generatedShortCode);
		expect(data.targetType).toBe("listing");
		expect(data.targetId).toBe(activeListingId);
		expect(data.clicks).toBe(1); // from test 3
		expect(data.impressions).toBe(2); // from test 4
	});

	test("6. Non-existent short link returns 404", async () => {
		const res = await shareApp.request("/r/non-existent-code-123");
		expect(res.status).toBe(404);
	});
});
