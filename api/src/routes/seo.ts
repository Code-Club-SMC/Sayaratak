import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { categories, makes, cities } from "../db/schemas/taxonomy-schema";
import { pages } from "../db/schemas/content-schema";
import { resolveLocale } from "../lib/i18n";
import { BASE_URL, ensureAbsoluteUrl, buildEntityPath, buildEntityUrl } from "../lib/url";
import {
	SLUG_KEYED_ENTITY_TYPES,
	ID_KEYED_ENTITY_TYPES,
	type ResolvableEntityType,
} from "../lib/entity-resolver";

export const seoApp = new Hono();

const DEFAULT_OG_IMAGE = `${BASE_URL}/sayaratak-og-default.jpg`;
const ALL_VALID_TYPES = [...SLUG_KEYED_ENTITY_TYPES, ...ID_KEYED_ENTITY_TYPES] as const;
type ValidSeoType = ResolvableEntityType;

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

// -------------------------------------------------------------
// SITEMAP CACHING (1 HOUR TTL)
// -------------------------------------------------------------
let sitemapCache: { xml: string; generatedAt: number } | null = null;
const SITEMAP_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function invalidateSitemapCache() {
	sitemapCache = null;
}

// =============================================================
// 1. GET /api/v1/seo/metadata/:type/:identifier
// =============================================================
seoApp.get("/metadata/:type/:identifier", async (c) => {
	const type = c.req.param("type").toLowerCase() as ValidSeoType;
	const identifier = c.req.param("identifier");
	const locale = c.get('locale') || resolveLocale(c.req);

	if (!ALL_VALID_TYPES.includes(type)) {
		return c.json({ error: `Invalid SEO entity type: ${type}`, code: "INVALID_ENTITY_TYPE" }, 400);
	}

	let resolvedTitle = "";
	let resolvedDescription = "";
	let ogImage = DEFAULT_OG_IMAGE;
	let ogType: "website" | "article" | "profile" | "product" = "website";
	let jsonLd: Record<string, any> = {};

	// ----------------- A. LISTING -----------------
	if (type === "listing" || type === "vehicle") {
		const [listing] = await db
			.select({
				id: listings.id,
				title: listings.title,
				description: listings.description,
				price: listings.price,
				currency: listings.currency,
				status: listings.status,
				year: listings.year,
				mileage: listings.mileage,
				transmission: listings.transmission,
				fuelType: listings.fuelType,
				condition: listings.condition,
				media: listings.media,
				createdAt: listings.createdAt,
				updatedAt: listings.updatedAt,
				categoryNameEn: categories.nameEn,
				categoryNameAr: categories.nameAr,
				makeNameEn: makes.nameEn,
				makeNameAr: makes.nameAr,
				cityNameEn: cities.nameEn,
				cityNameAr: cities.nameAr,
			})
			.from(listings)
			.leftJoin(categories, eq(listings.categoryId, categories.id))
			.leftJoin(makes, eq(listings.makeId, makes.id))
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.where(eq(listings.id, identifier));

		if (!listing) {
			return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
		}

		// §7: Inactive / sold listings must return 410 Gone
		if (listing.status !== "available") {
			return c.json({ error: "Listing is no longer available", code: "LISTING_GONE" }, 410);
		}

		ogType = "product";

		const rawPhotos: string[] = [];
		if (Array.isArray(listing.media)) {
			for (const item of listing.media) {
				if (typeof item === "string") rawPhotos.push(ensureAbsoluteUrl(item));
				else if (item && typeof item === "object" && item.url) rawPhotos.push(ensureAbsoluteUrl(item.url));
			}
		}
		if (rawPhotos.length > 0) ogImage = rawPhotos[0];

		const cityName = locale === "ar" ? listing.cityNameAr ?? listing.cityNameEn : listing.cityNameEn ?? "Sudan";
		const makeName = locale === "ar" ? listing.makeNameAr ?? listing.makeNameEn : listing.makeNameEn;
		const yearPrefix = listing.year ? (locale === "ar" ? `موديل ${listing.year} ` : `${listing.year} `) : "";

		if (locale === "ar") {
			resolvedTitle = `${yearPrefix}${makeName ? makeName + " - " : ""}${listing.title} في ${cityName} | سياراتك`;
			resolvedDescription = `${listing.title} للبيع في ${cityName}. السعر: ${listing.price} ${listing.currency}. ${stripHtml(listing.description).slice(0, 140)}`;
		} else {
			resolvedTitle = `${yearPrefix}${makeName ? makeName + " - " : ""}${listing.title} in ${cityName} | Sayaratak`;
			resolvedDescription = `${listing.title} for sale in ${cityName}. Price: ${listing.price} ${listing.currency}. ${stripHtml(listing.description).slice(0, 140)}`;
		}

		const canonicalUrl = buildEntityUrl("listing", listing.id, locale);

		// §1: Use schema.org/Product
		jsonLd = {
			"@context": "https://schema.org",
			"@type": "Product",
			name: resolvedTitle,
			description: resolvedDescription,
			image: rawPhotos.length > 0 ? rawPhotos : [DEFAULT_OG_IMAGE],
			...(listing.transmission ? { vehicleTransmission: listing.transmission } : {}),
			...(listing.mileage
				? {
						mileageFromOdometer: {
							"@type": "QuantitativeValue",
							value: listing.mileage,
							unitCode: "KMT",
						},
					}
				: {}),
			...(listing.fuelType ? { fuelType: listing.fuelType } : {}),
			...(listing.condition
				? {
						itemCondition:
							listing.condition.toLowerCase() === "new"
								? "https://schema.org/NewCondition"
								: "https://schema.org/UsedCondition",
					}
				: {}),
			...(makeName ? { brand: { "@type": "Brand", name: makeName } } : {}),
			...(listing.year ? { productionDate: `${listing.year}` } : {}),
			offers: {
				"@type": "Offer",
				price: listing.price,
				priceCurrency: listing.currency || "SDG",
				availability: "https://schema.org/InStock",
				url: canonicalUrl,
			},
		};
	}

	// ----------------- B. DEALERSHIP -----------------
	else if (type === "dealership" || type === "dealer") {
		const [dealer] = await db
			.select({
				id: dealerships.id,
				name: dealerships.name,
				description: dealerships.description,
				logoUrl: dealerships.logoUrl,
				coverUrl: dealerships.coverUrl,
				phone: dealerships.phone,
				ratingAvg: dealerships.ratingAvg,
				ratingCount: dealerships.ratingCount,
				isVerified: dealerships.isVerified,
				cityNameEn: cities.nameEn,
				cityNameAr: cities.nameAr,
			})
			.from(dealerships)
			.leftJoin(cities, eq(dealerships.cityId, cities.id))
			.where(eq(dealerships.id, identifier));

		if (!dealer) return c.json({ error: "Dealership not found", code: "DEALERSHIP_NOT_FOUND" }, 404);

		ogType = "profile";
		ogImage = ensureAbsoluteUrl(dealer.coverUrl || dealer.logoUrl);

		const cityName = locale === "ar" ? dealer.cityNameAr ?? dealer.cityNameEn : dealer.cityNameEn ?? "Sudan";
		const dealerName = dealer.name || (locale === "ar" ? "معرض سيارات" : "Car Dealership");

		if (locale === "ar") {
			resolvedTitle = `${dealerName} - معرض سيارات معتمد في ${cityName} | سياراتك`;
			resolvedDescription = dealer.description
				? stripHtml(dealer.description).slice(0, 160)
				: `استعرض أحدث السيارات المتاحة لدى ${dealerName} في ${cityName}.`;
		} else {
			resolvedTitle = `${dealerName} - Verified Car Dealership in ${cityName} | Sayaratak`;
			resolvedDescription = dealer.description
				? stripHtml(dealer.description).slice(0, 160)
				: `Explore the latest vehicles available at ${dealerName} in ${cityName}.`;
		}

		// §8: PII explicit allowlist (no internal IDs, no private user info)
		jsonLd = {
			"@context": "https://schema.org",
			"@type": "AutoDealer",
			name: dealerName,
			description: resolvedDescription,
			image: ogImage,
			...(dealer.phone ? { telephone: dealer.phone } : {}),
			...(cityName
				? {
						address: {
							"@type": "PostalAddress",
							addressLocality: cityName,
							addressCountry: "SD",
						},
					}
				: {}),
			...(dealer.ratingAvg > 0
				? {
						aggregateRating: {
							"@type": "AggregateRating",
							ratingValue: (dealer.ratingAvg / 10).toFixed(1),
							reviewCount: dealer.ratingCount,
						},
					}
				: {}),
		};
	}

	// ----------------- C. WORKSHOP -----------------
	else if (type === "workshop") {
		const [ws] = await db
			.select({
				id: workshops.id,
				name: workshops.name,
				logoUrl: workshops.logoUrl,
				address: workshops.address,
				phone: workshops.phone,
				ratingAvg: workshops.ratingAvg,
				ratingCount: workshops.ratingCount,
				isVerified: workshops.isVerified,
				cityNameEn: cities.nameEn,
				cityNameAr: cities.nameAr,
			})
			.from(workshops)
			.leftJoin(cities, eq(workshops.cityId, cities.id))
			.where(eq(workshops.id, identifier));

		if (!ws) return c.json({ error: "Workshop not found", code: "WORKSHOP_NOT_FOUND" }, 404);

		ogType = "profile";
		ogImage = ensureAbsoluteUrl(ws.logoUrl);

		const cityName = locale === "ar" ? ws.cityNameAr ?? ws.cityNameEn : ws.cityNameEn ?? "Sudan";
		const wsName = ws.name || (locale === "ar" ? "ورشة صيانة" : "Auto Workshop");

		if (locale === "ar") {
			resolvedTitle = `${wsName} - ورشة صيانة سيارات في ${cityName} | سياراتك`;
			resolvedDescription = `خدمات صيانة وإصلاح سيارات احترافية لدى ${wsName} في ${cityName}.`;
		} else {
			resolvedTitle = `${wsName} - Auto Repair & Service Workshop in ${cityName} | Sayaratak`;
			resolvedDescription = `Professional automotive repair and maintenance services at ${wsName} in ${cityName}.`;
		}

		// §8: PII explicit allowlist
		jsonLd = {
			"@context": "https://schema.org",
			"@type": "AutoRepair",
			name: wsName,
			description: resolvedDescription,
			image: ogImage,
			...(ws.phone ? { telephone: ws.phone } : {}),
			...(cityName
				? {
						address: {
							"@type": "PostalAddress",
							addressLocality: cityName,
							...(ws.address ? { streetAddress: ws.address } : {}),
							addressCountry: "SD",
						},
					}
				: {}),
			...(ws.ratingAvg > 0
				? {
						aggregateRating: {
							"@type": "AggregateRating",
							ratingValue: (ws.ratingAvg / 10).toFixed(1),
							reviewCount: ws.ratingCount,
						},
					}
				: {}),
		};
	}

	// ----------------- D. MECHANIC -----------------
	else if (type === "mechanic") {
		const [mech] = await db
			.select({
				id: mechanics.id,
				name: mechanics.name,
				profilePicUrl: mechanics.profilePicUrl,
				specialization: mechanics.specialization,
				bio: mechanics.bio,
				phone: mechanics.phone,
				yearsExperience: mechanics.yearsExperience,
				ratingAvg: mechanics.ratingAvg,
				ratingCount: mechanics.ratingCount,
				cityNameEn: cities.nameEn,
				cityNameAr: cities.nameAr,
			})
			.from(mechanics)
			.leftJoin(cities, eq(mechanics.cityId, cities.id))
			.where(eq(mechanics.id, identifier));

		if (!mech) return c.json({ error: "Mechanic not found", code: "MECHANIC_NOT_FOUND" }, 404);

		ogType = "profile";
		ogImage = ensureAbsoluteUrl(mech.profilePicUrl);

		const cityName = locale === "ar" ? mech.cityNameAr ?? mech.cityNameEn : mech.cityNameEn ?? "Sudan";
		const mechName = mech.name || (locale === "ar" ? "فني سيارات" : "Mechanic");
		const spec = mech.specialization || (locale === "ar" ? "صيانة سيارات" : "Automotive Specialist");

		if (locale === "ar") {
			resolvedTitle = `${mechName} (${spec}) - فني صيانة سيارات في ${cityName} | سياراتك`;
			resolvedDescription = mech.bio
				? stripHtml(mech.bio).slice(0, 160)
				: `${mechName}، فني ${spec} في ${cityName} مع خبرة ${mech.yearsExperience ?? 5} سنوات.`;
		} else {
			resolvedTitle = `${mechName} (${spec}) - Automotive Specialist in ${cityName} | Sayaratak`;
			resolvedDescription = mech.bio
				? stripHtml(mech.bio).slice(0, 160)
				: `${mechName}, ${spec} specialist in ${cityName} with ${mech.yearsExperience ?? 5} years of experience.`;
		}

		// §8: PII explicit allowlist (omit private data, user ids, personal addresses)
		jsonLd = {
			"@context": "https://schema.org",
			"@type": "Person",
			name: mechName,
			jobTitle: spec,
			description: resolvedDescription,
			image: ogImage,
			...(mech.phone ? { telephone: mech.phone } : {}),
			...(mech.yearsExperience ? { knowsAbout: `${mech.yearsExperience} years experience in automotive repair` } : {}),
		};
	}

	// ----------------- E. CATEGORY (SLUG-KEYED) -----------------
	else if (type === "category") {
		const [cat] = await db
			.select()
			.from(categories)
			.where(and(eq(categories.slug, identifier), eq(categories.isActive, true)));

		if (!cat) return c.json({ error: "Category not found", code: "CATEGORY_NOT_FOUND" }, 404);

		ogImage = ensureAbsoluteUrl(cat.iconUrl);

		if (locale === "ar") {
			resolvedTitle = `${cat.nameAr} في السودان | سياراتك`;
			resolvedDescription = `تصفح أحدث إعلانات ${cat.nameAr} المتاحة للبيع والشراء في السودان على منصة سياراتك.`;
		} else {
			resolvedTitle = `${cat.nameEn} in Sudan | Sayaratak`;
			resolvedDescription = `Browse the latest ${cat.nameEn.toLowerCase()} for sale and rent across Sudan on Sayaratak.`;
		}

		jsonLd = {
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: resolvedTitle,
			description: resolvedDescription,
			url: buildEntityUrl(type as any, identifier, locale),
		};
	}

	// ----------------- F. MAKE (SLUG-KEYED) -----------------
	else if (type === "make") {
		const [mk] = await db
			.select()
			.from(makes)
			.where(and(eq(makes.slug, identifier), eq(makes.isActive, true)));

		if (!mk) return c.json({ error: "Make not found", code: "MAKE_NOT_FOUND" }, 404);

		ogImage = ensureAbsoluteUrl(mk.logoUrl);

		const makeName = locale === "ar" ? mk.nameAr : mk.nameEn;

		if (locale === "ar") {
			resolvedTitle = `سيارات ${makeName} للبيع في السودان | سياراتك`;
			resolvedDescription = `اعثر على أفضل سيارات ${makeName} الجديدة والمستعملة للبيع في السودان بأسعار منافسة على سياراتك.`;
		} else {
			resolvedTitle = `${makeName} Cars for Sale in Sudan | Sayaratak`;
			resolvedDescription = `Find new and used ${makeName} vehicles for sale across Sudan on Sayaratak.`;
		}

		jsonLd = {
			"@context": "https://schema.org",
			"@type": "Brand",
			name: makeName,
			logo: ogImage,
			url: buildEntityUrl(type as any, identifier, locale),
		};
	}

	// ----------------- G. CMS PAGE (SLUG-KEYED) -----------------
	else if (type === "page") {
		const [pg] = await db
			.select()
			.from(pages)
			.where(and(eq(pages.slug, identifier), eq(pages.isActive, true)));

		if (!pg) return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);

		if (locale === "ar") {
			resolvedTitle = `${pg.titleAr || pg.title} | سياراتك`;
			resolvedDescription = stripHtml(pg.contentAr || pg.content).slice(0, 160);
		} else {
			resolvedTitle = `${pg.title} | Sayaratak`;
			resolvedDescription = stripHtml(pg.content).slice(0, 160);
		}

		jsonLd = {
			"@context": "https://schema.org",
			"@type": "WebPage",
			name: resolvedTitle,
			description: resolvedDescription,
			url: buildEntityUrl(type as any, identifier, locale),
		};
	}

	const canonical = buildEntityUrl(type as any, identifier, locale);

	// §4: Alternates hreflang array
	const alternates = [
		{ hreflang: "en" as const, href: buildEntityUrl(type as any, identifier, "en") },
		{ hreflang: "ar" as const, href: buildEntityUrl(type as any, identifier, "ar") },
		{ hreflang: "x-default" as const, href: buildEntityUrl(type as any, identifier, "en") },
	];

	const response = {
		title: resolvedTitle,
		description: resolvedDescription,
		canonical,
		alternates,
		og: {
			title: resolvedTitle,
			description: resolvedDescription,
			url: canonical,
			type: ogType,
			image: ogImage,
			siteName: locale === "ar" ? "سياراتك" : "Sayaratak",
			locale: locale === "ar" ? "ar_SD" : "en_US",
		},
		twitter: {
			card: "summary_large_image" as const,
			title: resolvedTitle,
			description: resolvedDescription,
			image: ogImage,
		},
		jsonLd,
		robots: {
			index: true,
			follow: true,
		},
	};

	return c.json(response);
});

// =============================================================
// 2. GET /api/v1/seo/sitemap.xml
// =============================================================
seoApp.get("/sitemap.xml", async (c) => {
	const now = Date.now();

	// Serve cached sitemap if valid
	if (sitemapCache && now - sitemapCache.generatedAt < SITEMAP_CACHE_TTL) {
		c.header("Content-Type", "application/xml; charset=utf-8");
		c.header("Cache-Control", "public, max-age=3600");
		return c.body(sitemapCache.xml);
	}

	// 1. Fetch all indexable data
	const activeListings = await db
		.select({
			id: listings.id,
			updatedAt: listings.updatedAt,
			media: listings.media,
		})
		.from(listings)
		.where(eq(listings.status, "available"))
		.orderBy(desc(listings.updatedAt))
		.limit(45000); // Buffer under 50k cap

	const activeCategories = await db
		.select({ slug: categories.slug, updatedAt: categories.updatedAt })
		.from(categories)
		.where(eq(categories.isActive, true));

	const activeMakes = await db
		.select({ slug: makes.slug, updatedAt: makes.updatedAt })
		.from(makes)
		.where(eq(makes.isActive, true));

	const verifiedDealers = await db
		.select({ id: dealerships.id, updatedAt: dealerships.updatedAt })
		.from(dealerships)
		.where(eq(dealerships.isVerified, true));

	const verifiedWorkshops = await db
		.select({ id: workshops.id, updatedAt: workshops.updatedAt })
		.from(workshops)
		.where(eq(workshops.isVerified, true));

	const activeCmsPages = await db
		.select({ slug: pages.slug, updatedAt: pages.updatedAt })
		.from(pages)
		.where(eq(pages.isActive, true));

	const dateStr = new Date().toISOString().split("T")[0];

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

	// Static & Home
	xml += `  <url>\n    <loc>${BASE_URL}/en</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${BASE_URL}/ar"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en"/>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

	// CMS Pages
	for (const p of activeCmsPages) {
		const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : dateStr;
		xml += `  <url>\n    <loc>${buildEntityUrl("page", p.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("page", p.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("page", p.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
	}

	// Categories
	for (const cat of activeCategories) {
		const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split("T")[0] : dateStr;
		xml += `  <url>\n    <loc>${buildEntityUrl("category", cat.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("category", cat.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("category", cat.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
	}

	// Makes
	for (const mk of activeMakes) {
		const lastmod = mk.updatedAt ? new Date(mk.updatedAt).toISOString().split("T")[0] : dateStr;
		xml += `  <url>\n    <loc>${buildEntityUrl("make", mk.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("make", mk.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("make", mk.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
	}

	// Verified Dealerships
	for (const d of verifiedDealers) {
		const lastmod = d.updatedAt ? new Date(d.updatedAt).toISOString().split("T")[0] : dateStr;
		xml += `  <url>\n    <loc>${buildEntityUrl("dealer", d.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("dealer", d.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("dealer", d.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
	}

	// Verified Workshops
	for (const w of verifiedWorkshops) {
		const lastmod = w.updatedAt ? new Date(w.updatedAt).toISOString().split("T")[0] : dateStr;
		xml += `  <url>\n    <loc>${buildEntityUrl("workshop", w.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("workshop", w.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("workshop", w.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
	}

	// Available Listings
	for (const l of activeListings) {
		const lastmod = l.updatedAt ? new Date(l.updatedAt).toISOString().split("T")[0] : dateStr;
		let imgXml = "";
		if (Array.isArray(l.media) && l.media.length > 0) {
			const firstMedia = l.media[0];
			const imgUrl = typeof firstMedia === "string" ? firstMedia : firstMedia?.url;
			if (imgUrl) {
				imgXml = `\n    <image:image>\n      <image:loc>${ensureAbsoluteUrl(imgUrl)}</image:loc>\n    </image:image>`;
			}
		}

		xml += `  <url>\n    <loc>${buildEntityUrl("listing", l.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("listing", l.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("listing", l.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>${imgXml}\n  </url>\n`;
	}

	xml += "</urlset>";

	sitemapCache = {
		xml,
		generatedAt: now,
	};

	c.header("Content-Type", "application/xml; charset=utf-8");
	c.header("Cache-Control", "public, max-age=3600");
	return c.body(xml);
});

// =============================================================
// 2A. GET /api/v1/seo/sitemap-index.xml
// =============================================================
seoApp.get("/sitemap-index.xml", async (c) => {
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(listings)
		.where(eq(listings.status, "available"));

	const chunkSize = 40000;
	const totalListingPages = Math.max(1, Math.ceil(count / chunkSize));
	const dateStr = new Date().toISOString().split("T")[0];

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
	xml += `  <sitemap>\n    <loc>${BASE_URL}/api/v1/seo/sitemaps/static.xml</loc>\n    <lastmod>${dateStr}</lastmod>\n  </sitemap>\n`;

	for (let i = 1; i <= totalListingPages; i++) {
		xml += `  <sitemap>\n    <loc>${BASE_URL}/api/v1/seo/sitemaps/listings-${i}.xml</loc>\n    <lastmod>${dateStr}</lastmod>\n  </sitemap>\n`;
	}

	xml += "</sitemapindex>";

	c.header("Content-Type", "application/xml; charset=utf-8");
	c.header("Cache-Control", "public, max-age=3600");
	return c.body(xml);
});

// =============================================================
// 2B. GET /api/v1/seo/sitemaps/:name
// =============================================================
seoApp.get("/sitemaps/:name", async (c) => {
	const rawName = c.req.param("name").replace(/\.xml$/, "");

	// Static sub-sitemap
	if (rawName === "static") {
		const activeCategories = await db
			.select({ slug: categories.slug, updatedAt: categories.updatedAt })
			.from(categories)
			.where(eq(categories.isActive, true));

		const activeMakes = await db
			.select({ slug: makes.slug, updatedAt: makes.updatedAt })
			.from(makes)
			.where(eq(makes.isActive, true));

		const verifiedDealers = await db
			.select({ id: dealerships.id, updatedAt: dealerships.updatedAt })
			.from(dealerships)
			.where(eq(dealerships.isVerified, true));

		const verifiedWorkshops = await db
			.select({ id: workshops.id, updatedAt: workshops.updatedAt })
			.from(workshops)
			.where(eq(workshops.isVerified, true));

		const activeCmsPages = await db
			.select({ slug: pages.slug, updatedAt: pages.updatedAt })
			.from(pages)
			.where(eq(pages.isActive, true));

		const dateStr = new Date().toISOString().split("T")[0];

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

		// Static & Home
		xml += `  <url>\n    <loc>${BASE_URL}/en</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${BASE_URL}/ar"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en"/>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

		// CMS Pages
		for (const p of activeCmsPages) {
			const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : dateStr;
			xml += `  <url>\n    <loc>${buildEntityUrl("page", p.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("page", p.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("page", p.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
		}

		// Categories
		for (const cat of activeCategories) {
			const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split("T")[0] : dateStr;
			xml += `  <url>\n    <loc>${buildEntityUrl("category", cat.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("category", cat.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("category", cat.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
		}

		// Makes
		for (const mk of activeMakes) {
			const lastmod = mk.updatedAt ? new Date(mk.updatedAt).toISOString().split("T")[0] : dateStr;
			xml += `  <url>\n    <loc>${buildEntityUrl("make", mk.slug, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("make", mk.slug, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("make", mk.slug, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
		}

		// Verified Dealerships
		for (const d of verifiedDealers) {
			const lastmod = d.updatedAt ? new Date(d.updatedAt).toISOString().split("T")[0] : dateStr;
			xml += `  <url>\n    <loc>${buildEntityUrl("dealer", d.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("dealer", d.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("dealer", d.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
		}

		// Verified Workshops
		for (const w of verifiedWorkshops) {
			const lastmod = w.updatedAt ? new Date(w.updatedAt).toISOString().split("T")[0] : dateStr;
			xml += `  <url>\n    <loc>${buildEntityUrl("workshop", w.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("workshop", w.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("workshop", w.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
		}

		xml += "</urlset>";

		c.header("Content-Type", "application/xml; charset=utf-8");
		c.header("Cache-Control", "public, max-age=3600");
		return c.body(xml);
	}

	// Chunked Listings sub-sitemaps (e.g. listings-1, listings-2)
	if (rawName.startsWith("listings-")) {
		const pageStr = rawName.replace("listings-", "");
		const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
		const chunkSize = 40000;
		const offset = (pageNum - 1) * chunkSize;

		const chunkListings = await db
			.select({
				id: listings.id,
				updatedAt: listings.updatedAt,
				media: listings.media,
			})
			.from(listings)
			.where(eq(listings.status, "available"))
			.orderBy(desc(listings.updatedAt))
			.limit(chunkSize)
			.offset(offset);

		const dateStr = new Date().toISOString().split("T")[0];

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

		for (const l of chunkListings) {
			const lastmod = l.updatedAt ? new Date(l.updatedAt).toISOString().split("T")[0] : dateStr;
			let imgXml = "";
			if (Array.isArray(l.media) && l.media.length > 0) {
				const firstMedia = l.media[0];
				const imgUrl = typeof firstMedia === "string" ? firstMedia : firstMedia?.url;
				if (imgUrl) {
					imgXml = `\n    <image:image>\n      <image:loc>${ensureAbsoluteUrl(imgUrl)}</image:loc>\n    </image:image>`;
				}
			}

			xml += `  <url>\n    <loc>${buildEntityUrl("listing", l.id, "en")}</loc>\n    <xhtml:link rel="alternate" hreflang="ar" href="${buildEntityUrl("listing", l.id, "ar")}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${buildEntityUrl("listing", l.id, "en")}"/>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>${imgXml}\n  </url>\n`;
		}

		xml += "</urlset>";

		c.header("Content-Type", "application/xml; charset=utf-8");
		c.header("Cache-Control", "public, max-age=3600");
		return c.body(xml);
	}

	return c.text("Sitemap not found", 404);
});

// =============================================================
// 3. GET /api/v1/seo/robots.txt
// =============================================================
seoApp.get("/robots.txt", async (c) => {
	const robotsTxt = [
		"User-agent: *",
		"Disallow: /admin",
		"Disallow: /api/",
		"Disallow: /dashboard",
		"Disallow: /account",
		"Disallow: /auth/",
		"Disallow: /*?*session=",
		`Sitemap: ${BASE_URL}/api/v1/seo/sitemap-index.xml`,
		`Sitemap: ${BASE_URL}/api/v1/seo/sitemap.xml`,
	].join("\n");

	c.header("Content-Type", "text/plain; charset=utf-8");
	c.header("Cache-Control", "public, max-age=86400");
	return c.text(robotsTxt);
});
