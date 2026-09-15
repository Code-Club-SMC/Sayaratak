import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { seoApp } from "../src/routes/seo";
import { db } from "../src/db";
import { listings } from "../src/db/schemas/listing-schema";
import { dealerships, workshops, mechanics } from "../src/db/schemas/profile-schema";
import { categories, makes, models, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { pages } from "../src/db/schemas/content-schema";
import { user } from "../src/db/schemas/auth-schema";
import { eq } from "drizzle-orm";

let testUserId: string;
let testCountryId: string;
let testCityId: string;
let testCategoryId: string;
let testMakeId: string;
let testModelId: string;
let activeListingId: string;
let soldListingId: string;
let dealerId: string;
let workshopId: string;
let mechanicId: string;
let testPageSlug: string;

beforeAll(async () => {
	const uuid = crypto.randomUUID().slice(0, 8);
	testUserId = "user_seo_" + uuid;
	testPageSlug = "seo-test-page-" + uuid;

	// 1. Create User
	await db.insert(user).values({
		id: testUserId,
		name: "SEO Test User",
		email: `${testUserId}@sayaratak.com`,
		role: "user",
		accountType: "user",
	});

	// 2. Taxonomy & Location
	const [country] = await db
		.insert(countries)
		.values({
			nameEn: "Sudan SEO " + uuid,
			nameAr: "السودان",
			code: "S" + uuid.slice(0, 1).toUpperCase(),
		})
		.returning();
	testCountryId = country.id;

	const [city] = await db
		.insert(cities)
		.values({
			countryId: testCountryId,
			nameEn: "Khartoum SEO",
			nameAr: "الخرطوم",
		})
		.returning();
	testCityId = city.id;

	const [cat] = await db
		.insert(categories)
		.values({
			nameEn: "Cars SEO",
			nameAr: "سيارات سيو",
			slug: "cars-seo-" + uuid,
		})
		.returning();
	testCategoryId = cat.id;

	const [mk] = await db
		.insert(makes)
		.values({
			nameEn: "Toyota SEO",
			nameAr: "تويوتا سيو",
			slug: "toyota-seo-" + uuid,
		})
		.returning();
	testMakeId = mk.id;

	const [md] = await db
		.insert(models)
		.values({
			makeId: testMakeId,
			nameEn: "Corolla SEO",
			nameAr: "كورولا سيو",
			slug: "corolla-seo-" + uuid,
		})
		.returning();
	testModelId = md.id;

	// 3. Active Available Listing
	const [actListing] = await db
		.insert(listings)
		.values({
			userId: testUserId,
			categoryId: testCategoryId,
			makeId: testMakeId,
			modelId: testModelId,
			countryId: testCountryId,
			cityId: testCityId,
			title: "2023 Toyota Corolla Clean",
			description: "Pristine condition Corolla in Khartoum. Full service history.",
			price: 15000000,
			currency: "SDG",
			year: 2023,
			mileage: 25000,
			transmission: "Automatic",
			fuelType: "Petrol",
			condition: "Used",
			status: "available",
			media: [{ url: "https://cdn.sayaratak.com/corolla.jpg", isPrimary: true }],
		})
		.returning();
	activeListingId = actListing.id;

	// 4. Sold / Inactive Listing
	const [soldListing] = await db
		.insert(listings)
		.values({
			userId: testUserId,
			categoryId: testCategoryId,
			countryId: testCountryId,
			cityId: testCityId,
			title: "2020 Hyundai Accent Sold",
			description: "Sold vehicle",
			price: 9000000,
			currency: "SDG",
			status: "sold",
		})
		.returning();
	soldListingId = soldListing.id;

	// 5. Profiles
	const [dealer] = await db
		.insert(dealerships)
		.values({
			userId: testUserId,
			name: "Al-Amana Motors",
			description: "Leading car dealership in Khartoum",
			cityId: testCityId,
			phone: "+249123456789",
			isVerified: true,
			ratingAvg: 48,
			ratingCount: 15,
		})
		.returning();
	dealerId = dealer.id;

	const [ws] = await db
		.insert(workshops)
		.values({
			userId: testUserId,
			name: "Precision Auto Care",
			address: "Airport Road, Khartoum",
			cityId: testCityId,
			phone: "+249987654321",
			isVerified: true,
			ratingAvg: 45,
			ratingCount: 10,
		})
		.returning();
	workshopId = ws.id;

	const [mech] = await db
		.insert(mechanics)
		.values({
			userId: testUserId,
			name: "Ahmed Hassan",
			specialization: "Engine & Hybrid Specialist",
			bio: "Over 12 years of hands-on automotive repair experience.",
			cityId: testCityId,
			yearsExperience: 12,
			isVerified: true,
		})
		.returning();
	mechanicId = mech.id;

	// 6. CMS Page
	await db.insert(pages).values({
		slug: testPageSlug,
		title: "Careers at Sayaratak",
		titleAr: "وظائف سياراتك",
		content: "<p>Join our growing team.</p>",
		contentAr: "<p>انضم إلى فريقنا المتنامي.</p>",
		isActive: true,
	});
});

afterAll(async () => {
	await db.delete(listings).where(eq(listings.id, activeListingId));
	await db.delete(listings).where(eq(listings.id, soldListingId));
	await db.delete(dealerships).where(eq(dealerships.id, dealerId));
	await db.delete(workshops).where(eq(workshops.id, workshopId));
	await db.delete(mechanics).where(eq(mechanics.id, mechanicId));
	await db.delete(pages).where(eq(pages.slug, testPageSlug));
	await db.delete(models).where(eq(models.id, testModelId));
	await db.delete(makes).where(eq(makes.id, testMakeId));
	await db.delete(categories).where(eq(categories.id, testCategoryId));
	await db.delete(cities).where(eq(cities.id, testCityId));
	await db.delete(countries).where(eq(countries.id, testCountryId));
	await db.delete(user).where(eq(user.id, testUserId));
});

describe("SEO & Meta Tags API — Hardening Verification", () => {
	// §1 & §3 & §4 & §5: Listing Metadata & schema.org/Product
	test("1. Listing metadata returns schema.org/Product, locale resolution, canonical, and alternates", async () => {
		// English fetch
		const resEn = await seoApp.request(`/metadata/listing/${activeListingId}?locale=en`);
		expect(resEn.status).toBe(200);
		const dataEn = await resEn.json();

		expect(dataEn.title).toContain("2023");
		expect(dataEn.title).toContain("Toyota SEO");
		expect(dataEn.title).toContain("Corolla");
		expect(dataEn.title).toContain("Sayaratak");
		expect(dataEn.description).toContain("Khartoum SEO");

		// No dual titleAr/descriptionAr in root payload
		expect(dataEn.titleAr).toBeUndefined();
		expect(dataEn.descriptionAr).toBeUndefined();

		// Canonical
		expect(dataEn.canonical).toBe(`https://sayaratak.com/en/listings/${activeListingId}`);

		// Alternates (hreflang)
		expect(Array.isArray(dataEn.alternates)).toBe(true);
		expect(dataEn.alternates).toHaveLength(3);
		expect(dataEn.alternates).toContainEqual({
			hreflang: "en",
			href: `https://sayaratak.com/en/listings/${activeListingId}`,
		});
		expect(dataEn.alternates).toContainEqual({
			hreflang: "ar",
			href: `https://sayaratak.com/ar/listings/${activeListingId}`,
		});
		expect(dataEn.alternates).toContainEqual({
			hreflang: "x-default",
			href: `https://sayaratak.com/en/listings/${activeListingId}`,
		});

		// JSON-LD is schema.org/Product (NOT Car / Vehicle Listing)
		expect(dataEn.jsonLd["@context"]).toBe("https://schema.org");
		expect(dataEn.jsonLd["@type"]).toBe("Product");
		expect(dataEn.jsonLd["@type"]).not.toBe("Car");
		expect(dataEn.jsonLd["@type"]).not.toBe("Vehicle");
		expect(dataEn.jsonLd.offers).toBeDefined();
		expect(dataEn.jsonLd.offers.price).toBe(15000000);
		expect(dataEn.jsonLd.offers.availability).toBe("https://schema.org/InStock");
		expect(dataEn.jsonLd.vehicleTransmission).toBe("Automatic");
		expect(dataEn.jsonLd.mileageFromOdometer.value).toBe(25000);

		// Arabic fetch
		const resAr = await seoApp.request(`/metadata/listing/${activeListingId}?locale=ar`);
		expect(resAr.status).toBe(200);
		const dataAr = await resAr.json();
		expect(dataAr.title).toContain("تويوتا سيو");
		expect(dataAr.title).toContain("سياراتك");
		expect(dataAr.canonical).toBe(`https://sayaratak.com/ar/listings/${activeListingId}`);
	});

	// §2: Route param mismatch (id vs slug)
	test("2. Route resolution branches by slug vs ID and rejects invalid types with 400", async () => {
		// Slug-keyed: page
		const pageRes = await seoApp.request(`/metadata/page/${testPageSlug}`);
		expect(pageRes.status).toBe(200);
		const pageData = await pageRes.json();
		expect(pageData.title).toContain("Careers at Sayaratak");
		expect(pageData.canonical).toBe(`https://sayaratak.com/en/${testPageSlug}`);

		// Slug-keyed: category
		const [cat] = await db.select().from(categories).where(eq(categories.id, testCategoryId));
		const catRes = await seoApp.request(`/metadata/category/${cat.slug}`);
		expect(catRes.status).toBe(200);

		// Slug-keyed: make
		const [mk] = await db.select().from(makes).where(eq(makes.id, testMakeId));
		const makeRes = await seoApp.request(`/metadata/make/${mk.slug}`);
		expect(makeRes.status).toBe(200);

		// Invalid type -> 400
		const badTypeRes = await seoApp.request(`/metadata/invalid-type/${testPageSlug}`);
		expect(badTypeRes.status).toBe(400);
		const errJson = await badTypeRes.json();
		expect(errJson.error).toContain("Invalid SEO entity type");
	});

	// §7: Sold / inactive listings return 410 Gone
	test("7. Sold/inactive listings return 410 Gone", async () => {
		const res = await seoApp.request(`/metadata/listing/${soldListingId}`);
		expect(res.status).toBe(410);
		const json = await res.json();
		expect(json.error).toBe("Listing is no longer available");
	});

	// §8: PII explicit allowlist audit
	test("8. Profile JSON-LD builders use explicit allowlists and omit sensitive PII", async () => {
		// Dealership
		const dealerRes = await seoApp.request(`/metadata/dealership/${dealerId}`);
		expect(dealerRes.status).toBe(200);
		const dealerData = await dealerRes.json();
		expect(dealerData.jsonLd["@type"]).toBe("AutoDealer");
		expect(dealerData.jsonLd.name).toBe("Al-Amana Motors");
		expect(dealerData.jsonLd.telephone).toBe("+249123456789");
		expect(dealerData.jsonLd.userId).toBeUndefined();
		expect(dealerData.jsonLd.email).toBeUndefined();

		// Workshop
		const wsRes = await seoApp.request(`/metadata/workshop/${workshopId}`);
		expect(wsRes.status).toBe(200);
		const wsData = await wsRes.json();
		expect(wsData.jsonLd["@type"]).toBe("AutoRepair");
		expect(wsData.jsonLd.name).toBe("Precision Auto Care");
		expect(wsData.jsonLd.address.streetAddress).toBe("Airport Road, Khartoum");
		expect(wsData.jsonLd.userId).toBeUndefined();

		// Mechanic
		const mechRes = await seoApp.request(`/metadata/mechanic/${mechanicId}`);
		expect(mechRes.status).toBe(200);
		const mechData = await mechRes.json();
		expect(mechData.jsonLd["@type"]).toBe("Person");
		expect(mechData.jsonLd.name).toBe("Ahmed Hassan");
		expect(mechData.jsonLd.jobTitle).toBe("Engine & Hybrid Specialist");
		expect(mechData.jsonLd.userId).toBeUndefined();
		expect(mechData.jsonLd.nationalId).toBeUndefined();
		expect(mechData.jsonLd.homeAddress).toBeUndefined();
		expect(mechData.jsonLd.email).toBeUndefined();
	});

	// §6: Sitemap generation, caching, and absolute URLs
	test("6. Sitemap XML endpoint returns valid XML with Cache-Control header", async () => {
		const res = await seoApp.request("/sitemap.xml");
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("application/xml");
		expect(res.headers.get("Cache-Control")).toContain("public, max-age=3600");

		const xml = await res.text();
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain("<urlset");
		expect(xml).toContain(`https://sayaratak.com/en/listings/${activeListingId}`);

		// Sold listing must be excluded
		expect(xml).not.toContain(`https://sayaratak.com/en/listings/${soldListingId}`);

		// Image URLs in sitemap are absolute
		expect(xml).toContain("<image:loc>https://cdn.sayaratak.com/corolla.jpg</image:loc>");

		// Sitemap Index
		const indexRes = await seoApp.request("/sitemap-index.xml");
		expect(indexRes.status).toBe(200);
		expect(indexRes.headers.get("Content-Type")).toContain("application/xml");
		const indexXml = await indexRes.text();
		expect(indexXml).toContain("<sitemapindex");
		expect(indexXml).toContain("/sitemaps/static.xml");
		expect(indexXml).toContain("/sitemaps/listings-1.xml");

		// Static sub-sitemap
		const staticRes = await seoApp.request("/sitemaps/static.xml");
		expect(staticRes.status).toBe(200);
		const staticXml = await staticRes.text();
		expect(staticXml).toContain("<urlset");
		expect(staticXml).toContain("/en/category/");

		// Listings sub-sitemap
		const listingsRes = await seoApp.request("/sitemaps/listings-1.xml");
		expect(listingsRes.status).toBe(200);
		const listingsXml = await listingsRes.text();
		expect(listingsXml).toContain("<urlset");
		expect(listingsXml).toContain(`/en/listings/${activeListingId}`);
	});

	// §9: robots.txt directives
	test("9. robots.txt contains expected Disallow rules and Sitemap directive", async () => {
		const res = await seoApp.request("/robots.txt");
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/plain");

		const txt = await res.text();
		expect(txt).toContain("User-agent: *");
		expect(txt).toContain("Disallow: /admin");
		expect(txt).toContain("Disallow: /api/");
		expect(txt).toContain("Disallow: /dashboard");
		expect(txt).toContain("Disallow: /account");
		expect(txt).toContain("Disallow: /auth/");
		expect(txt).toContain("Disallow: /*?*session=");
		expect(txt).toContain("Sitemap: https://sayaratak.com/api/v1/seo/sitemap-index.xml");
		expect(txt).toContain("Sitemap: https://sayaratak.com/api/v1/seo/sitemap.xml");
	});
});
