import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";
import { checkListingLimit } from "../lib/monetization";
import {
	deleteCloudinaryFolder,
	deleteCloudinaryResources,
	extractPublicId,
} from "../lib/cloudinary";
import { isBotUserAgent } from "../lib/bot-detection";

export const listingsApp = new Hono<{ Variables: { user: any } }>();

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const createListingSchema = z.object({
	categoryId: z.string().min(1),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	countryId: z.string().min(1),
	cityId: z.string().min(1),
	districtId: z.string().optional(),
	title: z.string().min(3),
	description: z.string().min(10),
	price: z.number().nonnegative(),
	currency: z.string().optional(),
	status: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
	year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
	mileage: z.number().int().min(0).optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	specs: z.record(z.string(), z.any()).optional(),
	media: z.array(z.union([z.string(), z.object({ url: z.string(), isPrimary: z.boolean().optional() })])).optional(),
	rentalPeriod: z.enum(["daily", "weekly", "monthly"]).optional()
});

const patchStatusSchema = z.object({
	status: z.enum(["draft", "available", "reserved", "sold", "rented"])
});

const clickSchema = z.object({
	type: z.enum(["view", "phone", "whatsapp"])
});

const getListingsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	lat: z.coerce.number().min(-90).max(90).optional(),
	lng: z.coerce.number().min(-180).max(180).optional(),
	radius: z.coerce.number().positive().default(50),
	categoryId: z.string().optional(),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	userId: z.string().optional(),
	cityId: z.string().optional(),
	districtId: z.string().optional(),
	minPrice: z.coerce.number().nonnegative().optional(),
	maxPrice: z.coerce.number().nonnegative().optional(),
	minYear: z.coerce.number().int().optional(),
	maxYear: z.coerce.number().int().optional(),
	maxMileage: z.coerce.number().int().nonnegative().optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	status: z.enum(["draft", "available", "reserved", "sold", "rented", "pending", "rejected", "banned"]).optional(),
});

const getMapListingsQuerySchema = z.object({
	minLat: z.coerce.number().min(-90).max(90),
	minLng: z.coerce.number().min(-180).max(180),
	maxLat: z.coerce.number().min(-90).max(90),
	maxLng: z.coerce.number().min(-180).max(180),
	zoom: z.coerce.number().min(1).max(22).default(10),
	categoryId: z.string().optional(),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	minPrice: z.coerce.number().nonnegative().optional(),
	maxPrice: z.coerce.number().nonnegative().optional(),
	minYear: z.coerce.number().int().optional(),
	maxYear: z.coerce.number().int().optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
});

// Explicit field projection for listing mutation responses (§6: never serialize full DB row)
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

function buildFilterConditions(query: Record<string, any>) {
	const conditions = [];

	if (query.categoryId) conditions.push(eq(listings.categoryId, query.categoryId));
	if (query.makeId) conditions.push(eq(listings.makeId, query.makeId));
	if (query.modelId) conditions.push(eq(listings.modelId, query.modelId));
	if (query.userId) conditions.push(eq(listings.userId, query.userId));
	if (query.cityId) conditions.push(eq(listings.cityId, query.cityId));
	if (query.districtId) conditions.push(eq(listings.districtId, query.districtId));

	if (query.minPrice !== undefined) conditions.push(sql`${listings.price} >= ${Number(query.minPrice)}`);
	if (query.maxPrice !== undefined) conditions.push(sql`${listings.price} <= ${Number(query.maxPrice)}`);
	if (query.minYear !== undefined) conditions.push(sql`${listings.year} >= ${Number(query.minYear)}`);
	if (query.maxYear !== undefined) conditions.push(sql`${listings.year} <= ${Number(query.maxYear)}`);
	if (query.maxMileage !== undefined) conditions.push(sql`${listings.mileage} <= ${Number(query.maxMileage)}`);
	if (query.transmission) conditions.push(eq(listings.transmission, query.transmission));
	if (query.fuelType) conditions.push(eq(listings.fuelType, query.fuelType));
	if (query.condition) conditions.push(eq(listings.condition, query.condition));

	return conditions;
}

// GET /api/listings
// Query params: lat, lng, radius (default 50), categoryId, makeId, modelId, status
listingsApp.get("/", zValidator("query", getListingsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	
	const page = query.page;
	const limit = query.limit;
	const offset = (page - 1) * limit;

	const conditions = buildFilterConditions(query);
	
	if (query.status) {
		conditions.push(eq(listings.status, query.status));
	} else {
		conditions.push(eq(listings.status, "available")); // Default to available
	}

	const publicListingSelection = {
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
		viewCount: listings.viewCount,
		phoneClickCount: listings.phoneClickCount,
		whatsappClickCount: listings.whatsappClickCount,
		favoriteCount: listings.favoriteCount,
		shareCount: listings.shareCount,
		shareClickCount: listings.shareClickCount,
		specs: listings.specs,
		media: listings.media,
		createdAt: listings.createdAt,
		updatedAt: listings.updatedAt,
	};

	let results;
	
	if (query.lat !== undefined && query.lng !== undefined) {
		const lat = query.lat;
		const lng = query.lng;
		const radius = query.radius; 
		
		conditions.push(sql`ST_DWithin(${listings.geom}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius * 1000})`);
		const distanceSql = sql`ST_Distance(${listings.geom}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`;
		
		results = await db.select({
			...publicListingSelection,
			distance: distanceSql,
		})
		.from(listings)
		.where(and(...conditions))
		.orderBy(distanceSql)
		.limit(limit)
		.offset(offset);
	} else {
		results = await db.select(publicListingSelection)
		.from(listings)
		.where(and(...conditions))
		.orderBy(sql`${listings.createdAt} DESC`)
		.limit(limit)
		.offset(offset);
	}
	
	return c.json(results);
});

// GET /api/listings/map
// Query params: minLat, minLng, maxLat, maxLng, zoom
listingsApp.get("/map", zValidator("query", getMapListingsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	
	const minLat = query.minLat;
	const minLng = query.minLng;
	const maxLat = query.maxLat;
	const maxLng = query.maxLng;
	
	const conditions = [
		eq(listings.status, "available"),
		sql`${listings.lat} BETWEEN ${minLat} AND ${maxLat}`,
		sql`${listings.lng} BETWEEN ${minLng} AND ${maxLng}`,
		...buildFilterConditions(query)
	];

	// Simple clustering using ST_SnapToGrid
	const zoom = query.zoom;
	const gridSize = 10 / Math.pow(2, zoom / 2); 

	const results = await db.select({
		count: sql<number>`count(*)`,
		lat: sql<number>`ST_Y(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326))))`,
		lng: sql<number>`ST_X(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326))))`,
	})
	.from(listings)
	.where(and(...conditions))
	.groupBy(sql`ST_SnapToGrid(ST_SetSRID(ST_MakePoint(${listings.lng}, ${listings.lat}), 4326), ${gridSize})`);

	return c.json(results);
});

// GET /api/listings/:id
listingsApp.get("/:id", async (c) => {
	const id = c.req.param("id");
	const [listing] = await db.select({
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
		viewCount: listings.viewCount,
		phoneClickCount: listings.phoneClickCount,
		whatsappClickCount: listings.whatsappClickCount,
		favoriteCount: listings.favoriteCount,
		shareCount: listings.shareCount,
		shareClickCount: listings.shareClickCount,
		specs: listings.specs,
		media: listings.media,
		createdAt: listings.createdAt,
		updatedAt: listings.updatedAt,
	}).from(listings).where(eq(listings.id, id));
	if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	return c.json(listing);
});

// POST /api/listings (requires auth)
listingsApp.post("/", zValidator("json", createListingSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	// Check if user has reached their subscription limit
	const canPost = await checkListingLimit(session.user.id);
	if (!canPost) {
		return c.json({ error: "Listing limit reached. Please upgrade your subscription.", code: "LIMIT_REACHED" }, 403);
	}

	const body = c.req.valid("json");

	const insertData = {
		userId: session.user.id,
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
		lat: body.lat ? Number(body.lat) : null,
		lng: body.lng ? Number(body.lng) : null,
		geom: body.lat && body.lng ? sql`ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)` : null,
		year: body.year ? Number(body.year) : null,
		mileage: body.mileage ? Number(body.mileage) : null,
		transmission: body.transmission || null,
		fuelType: body.fuelType || null,
		condition: body.condition || null,
		specs: body.specs || {},
		media: body.media || [],
		rentalPeriod: body.rentalPeriod || null
	} as any;

	const [created] = await db.insert(listings).values(insertData).returning(listingResponseFields);

	return c.json(created, 201);
});

// PUT /api/listings/:id (requires auth and ownership)
listingsApp.put("/:id", zValidator("json", createListingSchema.partial()), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const [existing] = await db.select().from(listings).where(eq(listings.id, id));
	
	if (!existing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	
	if (existing.userId !== session.user.id && session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const body = c.req.valid("json");

	// H-9: Enforce listing limit if transitioning to available
	if (body.status === "available" && existing.status !== "available") {
		const canPublish = await checkListingLimit(existing.userId);
		if (!canPublish) {
			return c.json({ error: "Listing limit reached. Please upgrade your subscription.", code: "LIMIT_REACHED" }, 403);
		}
	}

	// §7 & Edge Case 1: Photo removal/replacement cleanup
	if (body.media !== undefined && Array.isArray(existing.media)) {
		const oldIds = existing.media
			.map((item: any) => extractPublicId(typeof item === "string" ? item : item?.url))
			.filter(Boolean);
		const newIds = new Set(
			(body.media as any[])
				.map((item: any) => extractPublicId(typeof item === "string" ? item : item?.url))
				.filter(Boolean)
		);
		const removedIds = oldIds.filter((pid: string) => !newIds.has(pid));
		if (removedIds.length > 0) {
			await deleteCloudinaryResources(removedIds).catch((err) =>
				console.error("Cloudinary photo cleanup error:", err)
			);
		}
	}
	
	const updateData = {
		...body,
		updatedAt: new Date(),
	} as any;
	
	if (body.lat !== undefined && body.lng !== undefined) {
		updateData.geom = body.lat && body.lng ? sql`ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)` : null;
	}
	
	delete updateData.id;
	delete updateData.userId;
	delete updateData.createdAt;

	const [updated] = await db.update(listings).set(updateData).where(eq(listings.id, id)).returning(listingResponseFields);
	
	return c.json(updated);
});

// DELETE /api/listings/:id
listingsApp.delete("/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const [existing] = await db.select().from(listings).where(eq(listings.id, id));
	
	if (!existing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	
	if (existing.userId !== session.user.id && session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	await db.delete(listings).where(eq(listings.id, id));

	// §7: Cascade-delete Cloudinary folder for this listing
	await deleteCloudinaryFolder(`listings/${id}`).catch((err) =>
		console.error("Cloudinary listing folder cascade delete error:", err)
	);
	
	return c.json({ success: true, message: "Listing deleted" });
});

// PATCH /api/listings/:id/status (requires auth and ownership)
listingsApp.patch("/:id/status", zValidator("json", patchStatusSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const { status } = c.req.valid("json");

	const [existing] = await db.select().from(listings).where(eq(listings.id, id));
	if (!existing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	
	if (existing.userId !== session.user.id && session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	// H-9: Enforce listing limit if transitioning to available
	if (status === "available" && existing.status !== "available") {
		const canPublish = await checkListingLimit(existing.userId);
		if (!canPublish) {
			return c.json({ error: "Listing limit reached. Please upgrade your subscription.", code: "LIMIT_REACHED" }, 403);
		}
	}

	const [updated] = await db.update(listings)
		.set({ status, updatedAt: new Date() })
		.where(eq(listings.id, id))
		.returning(listingResponseFields);

	return c.json(updated);
});

// POST /api/listings/:id/clicks
// Public endpoint for analytics (increment view, phone, or whatsapp count)
listingsApp.post("/:id/clicks", zValidator("json", clickSchema), async (c) => {
	const id = c.req.param("id");
	const { type } = c.req.valid("json");

	const userAgent = c.req.header("user-agent");
	if (isBotUserAgent(userAgent)) {
		return c.json({ success: true });
	}

	if (type === "view") {
		await db.update(listings).set({ viewCount: sql`${listings.viewCount} + 1` }).where(eq(listings.id, id));
	} else if (type === "phone") {
		await db.update(listings).set({ phoneClickCount: sql`${listings.phoneClickCount} + 1` }).where(eq(listings.id, id));
	} else if (type === "whatsapp") {
		await db.update(listings).set({ whatsappClickCount: sql`${listings.whatsappClickCount} + 1` }).where(eq(listings.id, id));
	}

	return c.json({ success: true });
});
