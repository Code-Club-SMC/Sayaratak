import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { user } from "../db/schemas/auth-schema";
import { auth } from "../../lib/auth";
import { deleteCloudinaryResources, extractPublicId } from "../lib/cloudinary";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const profileTableMap = {
  dealership: dealerships,
  workshop: workshops,
  mechanic: mechanics,
} as const;

type ProfileType = keyof typeof profileTableMap;

function getProfileTable(type: string) {
  return profileTableMap[type as ProfileType] ?? null;
}

const mapProfileQuerySchema = z.object({
	minLat: z.coerce.number().min(-90).max(90),
	minLng: z.coerce.number().min(-180).max(180),
	maxLat: z.coerce.number().min(-90).max(90),
	maxLng: z.coerce.number().min(-180).max(180),
	zoom: z.coerce.number().min(1).max(22).default(10),
});

const patchProfileSchema = z.object({
	name: z.string().min(1).optional(),
	logoUrl: z.string().optional().nullable(),
	coverUrl: z.string().optional().nullable(),
	profilePicUrl: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	bio: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	whatsapp: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	cityId: z.string().optional().nullable(),
	districtId: z.string().optional().nullable(),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	yearsExperience: z.number().int().nonnegative().optional().nullable(),
	specialization: z.string().optional().nullable(),
	workingHours: z.record(z.string(), z.any()).optional().nullable(),
	images: z.array(z.string()).optional(),
	portfolioImages: z.array(z.string()).optional(),
});

export const profilesApp = new Hono();

// GET /api/profiles/:type/map (Clustering for map)
profilesApp.get("/:type/map", zValidator("query", mapProfileQuerySchema), async (c) => {
	const type = c.req.param("type");
	const query = c.req.valid("query");
	
	const minLat = query.minLat;
	const minLng = query.minLng;
	const maxLat = query.maxLat;
	const maxLng = query.maxLng;
	const zoom = query.zoom;
	const gridSize = 10 / Math.pow(2, zoom / 2); 

	const table = getProfileTable(type);
	if (!table || type === "mechanic") return c.json({ error: "Invalid profile type for map", code: "INVALID_PROFILE_TYPE" }, 400);
	
	const conditions = [
		// @ts-ignore
		sql`${table.lat} BETWEEN ${minLat} AND ${maxLat}`,
		// @ts-ignore
		sql`${table.lng} BETWEEN ${minLng} AND ${maxLng}`
	];

	const results = await db.select({
		count: sql<number>`count(*)`,
		// @ts-ignore
		lat: sql<number>`ST_Y(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${table.lng}, ${table.lat}), 4326))))`,
		// @ts-ignore
		lng: sql<number>`ST_X(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(${table.lng}, ${table.lat}), 4326))))`,
	})
	.from(table as any)
	.where(sql`${conditions[0]} AND ${conditions[1]}`)
	// @ts-ignore
	.groupBy(sql`ST_SnapToGrid(ST_SetSRID(ST_MakePoint(${table.lng}, ${table.lat}), 4326), ${gridSize})`);

	return c.json(results);
});

// GET /api/profiles/:type/:id (Public view)
profilesApp.get("/:type/:id", async (c) => {
	const type = c.req.param("type");
	const id = c.req.param("id");

	const table = getProfileTable(type);
	if (!table) return c.json({ error: "Invalid profile type", code: "INVALID_PROFILE_TYPE" }, 400);

	// Use explicit field allowlists per profile type to avoid leaking PII
	let profileData: Record<string, any> | null = null;

	if (type === "dealership") {
		const [row] = await db.select({
			id: dealerships.id,
			name: dealerships.name,
			logoUrl: dealerships.logoUrl,
			coverUrl: dealerships.coverUrl,
			description: dealerships.description,
			phone: dealerships.phone,
			cityId: dealerships.cityId,
			districtId: dealerships.districtId,
			lat: dealerships.lat,
			lng: dealerships.lng,
			isVerified: dealerships.isVerified,
			ratingAvg: dealerships.ratingAvg,
			ratingCount: dealerships.ratingCount,
			userId: dealerships.userId,
			createdAt: dealerships.createdAt,
		}).from(dealerships).where(eq(dealerships.id, id));
		profileData = row ?? null;
	} else if (type === "workshop") {
		const [row] = await db.select({
			id: workshops.id,
			name: workshops.name,
			logoUrl: workshops.logoUrl,
			cityId: workshops.cityId,
			districtId: workshops.districtId,
			address: workshops.address,
			lat: workshops.lat,
			lng: workshops.lng,
			phone: workshops.phone,
			workingHours: workshops.workingHours,
			images: workshops.images,
			isVerified: workshops.isVerified,
			ratingAvg: workshops.ratingAvg,
			ratingCount: workshops.ratingCount,
			userId: workshops.userId,
			createdAt: workshops.createdAt,
		}).from(workshops).where(eq(workshops.id, id));
		profileData = row ?? null;
	} else if (type === "mechanic") {
		const [row] = await db.select({
			id: mechanics.id,
			name: mechanics.name,
			profilePicUrl: mechanics.profilePicUrl,
			cityId: mechanics.cityId,
			yearsExperience: mechanics.yearsExperience,
			specialization: mechanics.specialization,
			bio: mechanics.bio,
			portfolioImages: mechanics.portfolioImages,
			isVerified: mechanics.isVerified,
			ratingAvg: mechanics.ratingAvg,
			ratingCount: mechanics.ratingCount,
			userId: mechanics.userId,
			createdAt: mechanics.createdAt,
		}).from(mechanics).where(eq(mechanics.id, id));
		// Note: mechanic phone/whatsapp intentionally excluded from public view
		profileData = row ?? null;
	}

	if (!profileData) return c.json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" }, 404);

	// Fetch basic user info — email intentionally excluded from public response
	const [userInfo] = await db
		.select({
			name: user.name,
			image: user.image,
		})
		.from(user)
		.where(eq(user.id, profileData.userId));

	return c.json({ ...profileData, user: userInfo });
});

// PATCH /api/profiles/:type (Update own profile)
profilesApp.patch("/:type", zValidator("json", patchProfileSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const type = c.req.param("type");
	const body = c.req.valid("json");
	const updateData = { ...body, updatedAt: new Date() } as any;

	// Prevent updating restricted fields
	delete updateData.id;
	delete updateData.userId;
	delete updateData.createdAt;
	delete updateData.isVerified; // Only admin can verify
	delete updateData.ratingAvg;
	delete updateData.ratingCount;

	const table = getProfileTable(type);
	if (!table) return c.json({ error: "Invalid profile type", code: "INVALID_PROFILE_TYPE" }, 400);

	// Fetch existing profile to detect image changes for Cloudinary cleanup
	const [existing] = await db
		.select()
		.from(table as any)
		.where(eq((table as any).userId, session.user.id));

	// §6: Clean up replaced Cloudinary assets on image field changes
	if (existing) {
		const imageFields = ["logoUrl", "coverUrl", "profilePicUrl"] as const;
		const removedUrls: string[] = [];

		for (const field of imageFields) {
			const oldVal = (existing as any)[field];
			const newVal = (body as any)[field];
			if (newVal !== undefined && oldVal && oldVal !== newVal) {
				const pubId = extractPublicId(oldVal);
				if (pubId) removedUrls.push(pubId);
			}
		}

		// Handle array image fields (images, portfolioImages)
		const arrayFields = ["images", "portfolioImages"] as const;
		for (const field of arrayFields) {
			const oldArr: string[] = (existing as any)[field] || [];
			const newArr: string[] | undefined = (body as any)[field];
			if (newArr !== undefined) {
				const newSet = new Set(newArr);
				for (const url of oldArr) {
					if (!newSet.has(url)) {
						const pubId = extractPublicId(url);
						if (pubId) removedUrls.push(pubId);
					}
				}
			}
		}

		if (removedUrls.length > 0) {
			await deleteCloudinaryResources(removedUrls).catch((err) =>
				console.error("Profile image Cloudinary cleanup error:", err)
			);
		}
	}

	if (session.user.accountType !== type && session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const [updated] = await db
		.update(table as any)
		.set(updateData)
		.where(eq((table as any).userId, session.user.id))
		.returning();

	if (!updated) return c.json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" }, 404);

	// §6: Return only safe profile fields, excluding any internal metadata
	const { userId: _uid, ...profileResponse } = updated as Record<string, any>;
	return c.json(profileResponse);
});
