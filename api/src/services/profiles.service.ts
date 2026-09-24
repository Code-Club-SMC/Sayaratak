import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { user as userTable } from "../db/schemas/auth-schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors";
import { deleteCloudinaryResources, extractPublicId } from "../lib/cloudinary";
import type { SessionUser } from "../middleware/auth";
import type { MapProfileQuery, PatchProfileInput, ProfileType } from "../schemas";

const profileTableMap = {
	dealership: dealerships,
	workshop: workshops,
	mechanic: mechanics,
} as const;

function getProfileTable(type: string) {
	return profileTableMap[type as ProfileType] ?? null;
}

export const profilesService = {
	async getProfilesMap(type: string, query: MapProfileQuery) {
		const table = getProfileTable(type);
		if (!table || type === "mechanic") {
			throw new BadRequestError("Invalid profile type for map", "INVALID_PROFILE_TYPE");
		}

		const { minLat, minLng, maxLat, maxLng, zoom } = query;
		const gridSize = 10 / Math.pow(2, zoom / 2);

		const conditions = [
			// @ts-ignore
			sql`${table.lat} BETWEEN ${minLat} AND ${maxLat}`,
			// @ts-ignore
			sql`${table.lng} BETWEEN ${minLng} AND ${maxLng}`,
		];

		return db
			.select({
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
	},

	async getProfileById(type: string, id: string) {
		const table = getProfileTable(type);
		if (!table) {
			throw new BadRequestError("Invalid profile type", "INVALID_PROFILE_TYPE");
		}

		let profileData: Record<string, any> | null = null;

		if (type === "dealership") {
			const [row] = await db
				.select({
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
				})
				.from(dealerships)
				.where(eq(dealerships.id, id));
			profileData = row ?? null;
		} else if (type === "workshop") {
			const [row] = await db
				.select({
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
				})
				.from(workshops)
				.where(eq(workshops.id, id));
			profileData = row ?? null;
		} else if (type === "mechanic") {
			const [row] = await db
				.select({
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
				})
				.from(mechanics)
				.where(eq(mechanics.id, id));
			profileData = row ?? null;
		}

		if (!profileData) {
			throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
		}

		const [userInfo] = await db
			.select({
				name: userTable.name,
				image: userTable.image,
			})
			.from(userTable)
			.where(eq(userTable.id, profileData.userId));

		return { ...profileData, user: userInfo ?? null };
	},

	async updateProfile(user: SessionUser, type: string, body: PatchProfileInput) {
		const table = getProfileTable(type);
		if (!table) {
			throw new BadRequestError("Invalid profile type", "INVALID_PROFILE_TYPE");
		}

		if (user.accountType !== type && user.role !== "admin") {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		const updateData = { ...body, updatedAt: new Date() } as any;

		// Prevent updating restricted fields
		delete updateData.id;
		delete updateData.userId;
		delete updateData.createdAt;
		delete updateData.isVerified; // Only admin can verify
		delete updateData.ratingAvg;
		delete updateData.ratingCount;

		// Fetch existing profile to detect image changes for Cloudinary cleanup
		const [existing] = await db
			.select()
			.from(table as any)
			.where(eq((table as any).userId, user.id));

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
					console.error("Profile image Cloudinary cleanup error:", err),
				);
			}
		}

		const [updated] = await db
			.update(table as any)
			.set(updateData)
			.where(eq((table as any).userId, user.id))
			.returning();

		if (!updated) {
			throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
		}

		// Return only safe profile fields, excluding any internal metadata
		const { userId: _uid, ...profileResponse } = updated as Record<string, any>;
		return profileResponse;
	},
};
