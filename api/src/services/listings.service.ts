import { eq, and, sql, asc, desc, or, inArray } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { user } from "../db/schemas/auth-schema";
import {
	cities,
	districts,
	models,
	categories,
} from "../db/schemas/taxonomy-schema";
import { dealerships } from "../db/schemas/profile-schema";
import { checkListingLimit } from "../lib/monetization";
import {
	deleteCloudinaryFolder,
	deleteCloudinaryResources,
	extractPublicId,
} from "../lib/cloudinary";
import { isBotUserAgent } from "../lib/bot-detection";
import { NotFoundError, ForbiddenError, GoneError } from "../lib/errors";
import type { SessionUser } from "../middleware/auth";
import type {
	CreateListingInput,
	UpdateListingInput,
	GetListingsQuery,
	GetMyListingsQuery,
	GetMapListingsQuery,
} from "../schemas";

type ListingListRow = typeof listings.$inferSelect & {
	city: { id: string; nameEn: string; nameAr: string } | null;
	district: { id: string; nameEn: string; nameAr: string } | null;
	user: {
		id: string;
		name: string;
		image: string | null;
		accountType: string;
	} | null;
	distance?: number;
};

function normalizeVehicleTypeFilter(vehicleType: string): string[] {
	const normalized = vehicleType.trim().toLowerCase();
	const aliases: Record<string, string[]> = {
		car: ["car"],
		cars: ["car"],
		suv: ["car"],
		suvs: ["car"],
		sedan: ["car"],
		hatchback: ["car"],
		pickup: ["truck"],
		truck: ["truck"],
		trucks: ["truck"],
		heavy: ["heavy_equipment"],
		heavy_equipment: ["heavy_equipment"],
		motorcycle: ["motorcycle"],
		motorcycles: ["motorcycle"],
		tuktuk: ["tuk-tuk"],
		"tuk-tuk": ["tuk-tuk"],
	};

	return aliases[normalized] ?? [normalized];
}

function getListingSortOrder(
	sort: "newest" | "price_asc" | "price_desc" | "mileage_asc",
	distanceSql?: any,
) {
	if (distanceSql && sort === "newest") return distanceSql;
	if (sort === "price_asc") return asc(listings.price);
	if (sort === "price_desc") return desc(listings.price);
	if (sort === "mileage_asc") return asc(listings.mileage);
	return desc(listings.createdAt);
}

// Explicit field projection for listing mutation responses (AGENTS.md §6: never serialize full DB row)
const listingResponseFields = {
	id: listings.id,
	userId: listings.userId,
	categoryId: listings.categoryId,
	makeId: listings.makeId,
	modelId: listings.modelId,
	countryId: listings.countryId,
	cityId: listings.cityId,
	districtId: listings.districtId,
	title: listings.title,
	description: listings.description,
	price: listings.price,
	currency: listings.currency,
	rentalPeriod: listings.rentalPeriod,
	status: listings.status,
	lat: listings.lat,
	lng: listings.lng,
	isFeatured: listings.isFeatured,
	year: listings.year,
	mileage: listings.mileage,
	transmission: listings.transmission,
	fuelType: listings.fuelType,
	condition: listings.condition,
	specs: listings.specs,
	media: listings.media,
	createdAt: listings.createdAt,
	updatedAt: listings.updatedAt,
};

const publicListingSelection = {
	...listingResponseFields,
	viewCount: listings.viewCount,
	phoneClickCount: listings.phoneClickCount,
	whatsappClickCount: listings.whatsappClickCount,
	favoriteCount: listings.favoriteCount,
	shareCount: listings.shareCount,
	shareClickCount: listings.shareClickCount,
	city: {
		id: cities.id,
		nameEn: cities.nameEn,
		nameAr: cities.nameAr,
	},
	district: {
		id: districts.id,
		nameEn: districts.nameEn,
		nameAr: districts.nameAr,
	},
	user: {
		id: user.id,
		name: user.name,
		image: user.image,
		accountType: user.accountType,
	},
};

function buildFilterConditions(query: Record<string, any>) {
	const conditions = [];

	if (query.categoryId)
		conditions.push(eq(listings.categoryId, query.categoryId));
	if (query.makeId) conditions.push(eq(listings.makeId, query.makeId));
	if (query.modelId) conditions.push(eq(listings.modelId, query.modelId));
	if (query.userId) conditions.push(eq(listings.userId, query.userId));
	if (query.cityId) conditions.push(eq(listings.cityId, query.cityId));
	if (query.districtId)
		conditions.push(eq(listings.districtId, query.districtId));

	if (query.minPrice !== undefined)
		conditions.push(sql`${listings.price} >= ${Number(query.minPrice)}`);
	if (query.maxPrice !== undefined)
		conditions.push(sql`${listings.price} <= ${Number(query.maxPrice)}`);
	if (query.minYear !== undefined)
		conditions.push(sql`${listings.year} >= ${Number(query.minYear)}`);
	if (query.maxYear !== undefined)
		conditions.push(sql`${listings.year} <= ${Number(query.maxYear)}`);
	if (query.maxMileage !== undefined)
		conditions.push(sql`${listings.mileage} <= ${Number(query.maxMileage)}`);
	if (query.transmission)
		conditions.push(eq(listings.transmission, query.transmission));
	if (query.fuelType) conditions.push(eq(listings.fuelType, query.fuelType));
	if (query.condition) conditions.push(eq(listings.condition, query.condition));

	return conditions;
}

export const listingsService = {
	async findListings(query: GetListingsQuery) {
		const page = query.page;
		const limit = query.limit;
		const offset = (page - 1) * limit;

		const conditions = buildFilterConditions(query);

		if (query.status) {
			conditions.push(eq(listings.status, query.status));
		} else {
			conditions.push(eq(listings.status, "available"));
		}

		if (query.q) {
			const pattern = `%${query.q}%`;
			conditions.push(
				or(
					sql`${listings.title} ILIKE ${pattern}`,
					sql`${listings.description} ILIKE ${pattern}`,
					sql`${cities.nameEn} ILIKE ${pattern}`,
					sql`${cities.nameAr} ILIKE ${pattern}`,
					sql`${models.nameEn} ILIKE ${pattern}`,
					sql`${models.nameAr} ILIKE ${pattern}`,
					sql`${categories.nameEn} ILIKE ${pattern}`,
					sql`${categories.nameAr} ILIKE ${pattern}`,
				),
			);
		}

		if (query.vehicleType) {
			const normalizedTypes = normalizeVehicleTypeFilter(query.vehicleType);
			conditions.push(
				or(
					inArray(models.vehicleType, normalizedTypes),
					eq(categories.slug, query.vehicleType),
				),
			);
		}

		if (query.sellerType) {
			if (query.sellerType === "individual") {
				conditions.push(eq(user.accountType, "user"));
			} else if (
				query.sellerType === "dealer" ||
				query.sellerType === "dealership"
			) {
				conditions.push(eq(user.accountType, "dealership"));
			} else if (
				query.sellerType === "workshop" ||
				query.sellerType === "mechanic"
			) {
				conditions.push(eq(user.accountType, query.sellerType));
			} else if (query.sellerType === "verified") {
				conditions.push(eq(dealerships.isVerified, true));
			}
		}

		let results: ListingListRow[];

		if (query.lat !== undefined && query.lng !== undefined) {
			const lat = query.lat;
			const lng = query.lng;
			const radius = query.radius;

			conditions.push(
				sql`ST_DWithin(${listings.geom}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius * 1000})`,
			);
			const distanceSql = sql`ST_Distance(${listings.geom}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`;
			const whereClause = and(...conditions);

			results = await db
				.select({
					...publicListingSelection,
					distance: distanceSql,
				})
				.from(listings)
				.leftJoin(models, eq(listings.modelId, models.id))
				.leftJoin(categories, eq(listings.categoryId, categories.id))
				.leftJoin(cities, eq(listings.cityId, cities.id))
				.leftJoin(districts, eq(listings.districtId, districts.id))
				.leftJoin(user, eq(listings.userId, user.id))
				.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
				.where(whereClause)
				.orderBy(getListingSortOrder(query.sort, distanceSql))
				.limit(limit)
				.offset(offset);
		} else {
			const whereClause = and(...conditions);
			results = await db
				.select(publicListingSelection)
				.from(listings)
				.leftJoin(models, eq(listings.modelId, models.id))
				.leftJoin(categories, eq(listings.categoryId, categories.id))
				.leftJoin(cities, eq(listings.cityId, cities.id))
				.leftJoin(districts, eq(listings.districtId, districts.id))
				.leftJoin(user, eq(listings.userId, user.id))
				.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
				.where(whereClause)
				.orderBy(getListingSortOrder(query.sort))
				.limit(limit)
				.offset(offset);
		}

		const whereClause = and(...conditions);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(listings)
			.leftJoin(models, eq(listings.modelId, models.id))
			.leftJoin(categories, eq(listings.categoryId, categories.id))
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.leftJoin(districts, eq(listings.districtId, districts.id))
			.leftJoin(user, eq(listings.userId, user.id))
			.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
			.where(whereClause);

		return {
			items: results,
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},

	async findMyListings(currentUser: SessionUser, query: GetMyListingsQuery) {
		const page = query.page;
		const limit = query.limit;
		const offset = (page - 1) * limit;
		const conditions = [eq(listings.userId, currentUser.id)];

		if (query.status) {
			conditions.push(eq(listings.status, query.status));
		}

		const whereClause = and(...conditions);

		const results = await db
			.select(publicListingSelection)
			.from(listings)
			.leftJoin(models, eq(listings.modelId, models.id))
			.leftJoin(categories, eq(listings.categoryId, categories.id))
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.leftJoin(districts, eq(listings.districtId, districts.id))
			.leftJoin(user, eq(listings.userId, user.id))
			.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
			.where(whereClause)
			.orderBy(desc(listings.updatedAt))
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(listings)
			.where(whereClause);

		return {
			items: results,
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},

	async findMapListings(query: GetMapListingsQuery) {
		const minLat = query.minLat;
		const minLng = query.minLng;
		const maxLat = query.maxLat;
		const maxLng = query.maxLng;

		const conditions = [
			eq(listings.status, "available"),
			sql`${listings.lat} BETWEEN ${minLat} AND ${maxLat}`,
			sql`${listings.lng} BETWEEN ${minLng} AND ${maxLng}`,
			...buildFilterConditions(query),
		];

		const zoom = query.zoom;
		const gridSize = 10 / Math.pow(2, zoom / 2);

		const results = await db
			.select({
				count: sql<number>`count(*)`,
				lat: sql<number>`ST_Y(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326))))`,
				lng: sql<number>`ST_X(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326))))`,
			})
			.from(listings)
			.where(and(...conditions))
			.groupBy(
				sql`ST_SnapToGrid(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326), ${gridSize})`,
			);

		return results;
	},

	async getListingById(id: string) {
		const [listing] = await db
			.select({
				...publicListingSelection,
				user: {
					id: user.id,
					name: user.name,
					image: user.image,
					accountType: user.accountType,
					phone: user.phone,
					isVerified: dealerships.isVerified,
				},
			})
			.from(listings)
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.leftJoin(districts, eq(listings.districtId, districts.id))
			.leftJoin(user, eq(listings.userId, user.id))
			.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
			.where(eq(listings.id, id));

		if (!listing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}
		if (listing.status !== "available") {
			throw new GoneError("Listing is no longer available", "LISTING_GONE");
		}
		return listing;
	},

	async getManagedListingById(id: string, currentUser: SessionUser) {
		const [listing] = await db
			.select({
				...publicListingSelection,
				user: {
					id: user.id,
					name: user.name,
					image: user.image,
					accountType: user.accountType,
					phone: user.phone,
					isVerified: dealerships.isVerified,
				},
			})
			.from(listings)
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.leftJoin(districts, eq(listings.districtId, districts.id))
			.leftJoin(user, eq(listings.userId, user.id))
			.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
			.where(eq(listings.id, id));

		if (!listing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		if (listing.userId !== currentUser.id && currentUser.role !== "admin") {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		return listing;
	},

	async createListing(userId: string, body: CreateListingInput) {
		const canPost = await checkListingLimit(userId);
		if (!canPost) {
			throw new ForbiddenError(
				"Listing limit reached. Please upgrade your subscription.",
				"LIMIT_REACHED",
			);
		}

		const insertData: typeof listings.$inferInsert = {
			userId,
			categoryId: body.categoryId,
			makeId: body.makeId || null,
			modelId: body.modelId || null,
			countryId: body.countryId,
			cityId: body.cityId,
			districtId: body.districtId || null,
			title: body.title,
			description: body.description,
			price: Number(body.price),
			currency: body.currency || "SDG",
			status: body.status || "draft",
			lat: body.lat ?? null,
			lng: body.lng ?? null,
			geom:
				body.lat !== undefined && body.lng !== undefined
					? sql`ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)`
					: null,
			year: body.year ?? null,
			mileage: body.mileage ?? null,
			transmission: body.transmission || null,
			fuelType: body.fuelType || null,
			condition: body.condition || null,
			specs: body.specs || {},
			media: (body.media || []).map((m) =>
				typeof m === "string"
					? { url: m, isPrimary: false }
					: { url: m.url, isPrimary: m.isPrimary ?? false },
			),
			rentalPeriod: body.rentalPeriod || null,
		};

		const [created] = await db
			.insert(listings)
			.values(insertData)
			.returning(listingResponseFields);

		return created;
	},

	async updateListing(
		id: string,
		currentUser: SessionUser,
		body: UpdateListingInput,
	) {
		const [existing] = await db
			.select()
			.from(listings)
			.where(eq(listings.id, id));

		if (!existing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		if (existing.userId !== currentUser.id && currentUser.role !== "admin") {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		if (body.status === "available" && existing.status !== "available") {
			const canPublish = await checkListingLimit(existing.userId);
			if (!canPublish) {
				throw new ForbiddenError(
					"Listing limit reached. Please upgrade your subscription.",
					"LIMIT_REACHED",
				);
			}
		}

		let removedIds: string[] = [];
		if (body.media !== undefined && Array.isArray(existing.media)) {
			const oldIds = existing.media
				.map((item: any) =>
					extractPublicId(typeof item === "string" ? item : item?.url),
				)
				.filter(Boolean) as string[];
			const newIds = new Set(
				body.media
					.map((item) =>
						extractPublicId(typeof item === "string" ? item : item?.url),
					)
					.filter(Boolean),
			);
			removedIds = oldIds.filter((pid: string) => !newIds.has(pid));
		}

		const { lat, lng, media, ...restBody } = body;
		const updateData: Partial<typeof listings.$inferInsert> = {
			...restBody,
			media: media
				? media.map((m) =>
						typeof m === "string"
							? { url: m, isPrimary: false }
							: { url: m.url, isPrimary: m.isPrimary ?? false },
					)
				: undefined,
			updatedAt: new Date(),
		};

		if (lat !== undefined && lng !== undefined) {
			updateData.lat = lat;
			updateData.lng = lng;
			updateData.geom = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
		}

		const [updated] = await db
			.update(listings)
			.set(updateData)
			.where(eq(listings.id, id))
			.returning(listingResponseFields);

		if (removedIds.length > 0) {
			await deleteCloudinaryResources(removedIds).catch((err) =>
				console.error("Cloudinary photo cleanup error:", err),
			);
		}

		return updated;
	},

	async deleteListing(id: string, currentUser: SessionUser) {
		const [existing] = await db
			.select()
			.from(listings)
			.where(eq(listings.id, id));

		if (!existing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		if (existing.userId !== currentUser.id && currentUser.role !== "admin") {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		await db.delete(listings).where(eq(listings.id, id));

		await deleteCloudinaryFolder(`listings/${id}`).catch((err) =>
			console.error("Cloudinary listing folder cascade delete error:", err),
		);

		return { success: true, message: "Listing deleted" };
	},

	async updateListingStatus(
		id: string,
		currentUser: SessionUser,
		status: string,
	) {
		const [existing] = await db
			.select()
			.from(listings)
			.where(eq(listings.id, id));
		if (!existing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		if (existing.userId !== currentUser.id && currentUser.role !== "admin") {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		if (status === "available" && existing.status !== "available") {
			const canPublish = await checkListingLimit(existing.userId);
			if (!canPublish) {
				throw new ForbiddenError(
					"Listing limit reached. Please upgrade your subscription.",
					"LIMIT_REACHED",
				);
			}
		}

		const [updated] = await db
			.update(listings)
			.set({ status, updatedAt: new Date() })
			.where(eq(listings.id, id))
			.returning(listingResponseFields);

		return updated;
	},

	async trackListingClick(
		id: string,
		type: "view" | "phone" | "whatsapp",
		userAgent?: string,
	) {
		if (isBotUserAgent(userAgent)) {
			return { success: true };
		}

		if (type === "view") {
			await db
				.update(listings)
				.set({ viewCount: sql`${listings.viewCount} + 1` })
				.where(eq(listings.id, id));
		} else if (type === "phone") {
			await db
				.update(listings)
				.set({ phoneClickCount: sql`${listings.phoneClickCount} + 1` })
				.where(eq(listings.id, id));
		} else if (type === "whatsapp") {
			await db
				.update(listings)
				.set({ whatsappClickCount: sql`${listings.whatsappClickCount} + 1` })
				.where(eq(listings.id, id));
		}

		return { success: true };
	},
};
