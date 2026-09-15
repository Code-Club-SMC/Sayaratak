import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mediaApp, resetSignatureRateLimits } from "../src/routes/media";
import { listingsApp } from "../src/routes/listings";
import {
	cloudinaryUrl,
	signUploadParams,
	extractPublicId,
	verifyCloudinaryAsset,
	cleanupStalePendingAssets,
	API_SECRET,
	CLOUD_NAME,
	cloudinary,
} from "../src/lib/cloudinary";
import { auth } from "../lib/auth";
import { db } from "../src/db";
import { listings } from "../src/db/schemas/listing-schema";
import { user } from "../src/db/schemas/auth-schema";
import { categories, countries, cities } from "../src/db/schemas/taxonomy-schema";
import { eq } from "drizzle-orm";

let userA: { id: string; name: string; email: string; role: string };
let userB: { id: string; name: string; email: string; role: string };
let adminUser: { id: string; name: string; email: string; role: string };

let testCountryId: string;
let testCityId: string;
let testCategoryId: string;
let listingAId: string;
let testUuid: string;

beforeAll(async () => {
	const uuid = crypto.randomUUID().slice(0, 8);
	testUuid = uuid;

	userA = {
		id: "user_a_" + uuid,
		name: "User A",
		email: `userA_${uuid}@sayaratak.com`,
		role: "user",
	};

	userB = {
		id: "user_b_" + uuid,
		name: "User B",
		email: `userB_${uuid}@sayaratak.com`,
		role: "user",
	};

	adminUser = {
		id: "admin_" + uuid,
		name: "Admin User",
		email: `admin_${uuid}@sayaratak.com`,
		role: "admin",
	};

	await db.insert(user).values([
		{ id: userA.id, name: userA.name, email: userA.email, role: userA.role, accountType: "user" },
		{ id: userB.id, name: userB.name, email: userB.email, role: userB.role, accountType: "user" },
		{ id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role, accountType: "admin" },
	]);

	const [country] = await db
		.insert(countries)
		.values({
			nameEn: "Sudan Media " + uuid,
			nameAr: "السودان",
			code: "M" + uuid.slice(0, 1).toUpperCase(),
		})
		.returning();
	testCountryId = country.id;

	const [city] = await db
		.insert(cities)
		.values({
			countryId: testCountryId,
			nameEn: "Khartoum Media",
			nameAr: "الخرطوم",
		})
		.returning();
	testCityId = city.id;

	const [cat] = await db
		.insert(categories)
		.values({
			nameEn: "Cars Media",
			nameAr: "سيارات",
			slug: "cars-media-" + uuid,
		})
		.returning();
	testCategoryId = cat.id;

	const [listing] = await db
		.insert(listings)
		.values({
			userId: userA.id,
			categoryId: testCategoryId,
			countryId: testCountryId,
			cityId: testCityId,
			title: "User A Listing",
			description: "Clean car for sale by User A",
			price: 5000000,
			currency: "SDG",
			status: "available",
			media: [
				{ url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/listings/${uuid}/photo1.jpg`, isPrimary: true },
				{ url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/listings/${uuid}/photo2.jpg` },
			],
		})
		.returning();
	listingAId = listing.id;
});

afterAll(async () => {
	await db.delete(listings).where(eq(listings.id, listingAId));
	await db.delete(categories).where(eq(categories.id, testCategoryId));
	await db.delete(cities).where(eq(cities.id, testCityId));
	await db.delete(countries).where(eq(countries.id, testCountryId));
	await db.delete(user).where(eq(user.id, userA.id));
	await db.delete(user).where(eq(user.id, userB.id));
	await db.delete(user).where(eq(user.id, adminUser.id));
});

describe("Media Handling API — Cloudinary Hardening Verification", () => {
	// §1 & §5: Authentication requirement
	test("1. Unauthenticated request to /media/signature returns 401", async () => {
		const res = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "listing", entityId: "some-listing-id" }),
		});

		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.error).toBe("Unauthorized");
	});

	// §1 & §2 & §4: Valid signature generation with server-enforced compression & formats
	test("2. Authenticated user gets valid Cloudinary signature with enforced compression & formats", async () => {
		// Mock User A session
		const origGetSession = auth.api.getSession;
		// @ts-ignore
		auth.api.getSession = async () => ({ session: {}, user: userA });

		const res = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "listing", entityId: listingAId }),
		});

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.signature).toBeDefined();
		expect(typeof data.signature).toBe("string");
		expect(data.apiKey).toBeDefined();
		expect(data.cloudName).toBe(CLOUD_NAME);
		expect(data.folder).toBe(`listings/${listingAId}`);
		expect(data.eager).toBe("c_limit,w_2000,h_2000,q_auto,f_auto");
		expect(data.allowed_formats).toBe("jpg,png,webp,jpeg,avif");
		expect(data.tags).toBe(`user_${userA.id},pending`);

		// Verify signature matches Cloudinary's expected HMAC-SHA1
		const expectedSignature = cloudinary.utils.api_sign_request(
			{
				allowed_formats: data.allowed_formats,
				eager: data.eager,
				folder: data.folder,
				tags: data.tags,
				timestamp: data.timestamp,
			},
			API_SECRET
		);

		expect(data.signature).toBe(expectedSignature);

		auth.api.getSession = origGetSession;
	});

	// §2: Tampering with signed params invalidates signature
	test("3. Altering signed params client-side causes signature mismatch", () => {
		const signed = signUploadParams({ userId: userA.id, folder: `listings/${listingAId}` });

		// Client attempts to remove eager compression or change folder
		const tamperedParams = {
			allowed_formats: signed.allowed_formats,
			eager: "none", // Tampered
			folder: "malicious_folder", // Tampered
			tags: signed.tags,
			timestamp: signed.timestamp,
		};

		const tamperedSignature = cloudinary.utils.api_sign_request(tamperedParams, API_SECRET);
		expect(tamperedSignature).not.toBe(signed.signature);
	});

	// Edge Case 2: Ownership verification at signature-request time
	test("4. Requesting signature for someone else's entity is forbidden (403)", async () => {
		const origGetSession = auth.api.getSession;
		// User B attempts to get signature for User A's listing
		// @ts-ignore
		auth.api.getSession = async () => ({ session: {}, user: userB });

		const res = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "listing", entityId: listingAId }),
		});

		expect(res.status).toBe(403);
		const json = await res.json();
		expect(json.error).toContain("You do not own this listing");

		// User B attempts to upload to User A's profile folder
		const resProfile = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "profile", entityId: userA.id }),
		});
		expect(resProfile.status).toBe(403);

		// Non-admin attempts to get signature for CMS page
		const resPage = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "page", entityId: "about-us" }),
		});
		expect(resPage.status).toBe(403);

		auth.api.getSession = origGetSession;
	});

	// §5: Rate limiting on signature generation
	test("5. Exceeding signature rate limit returns 429 Too Many Requests", async () => {
		resetSignatureRateLimits();
		const origGetSession = auth.api.getSession;
		// @ts-ignore
		auth.api.getSession = async () => ({ session: {}, user: userA });

		// Perform 30 requests (allowed threshold)
		for (let i = 0; i < 30; i++) {
			const res = await mediaApp.request("/signature", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ entityType: "listing", entityId: listingAId }),
			});
			expect(res.status).toBe(200);
		}

		// 31st request triggers rate limiter
		const blockedRes = await mediaApp.request("/signature", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entityType: "listing", entityId: listingAId }),
		});

		expect(blockedRes.status).toBe(429);
		const json = await blockedRes.json();
		expect(json.error).toContain("rate limit exceeded");

		auth.api.getSession = origGetSession;
	});

	// §3: Standardized delivery transformation helper
	test("6. Standardized delivery URL helper applies f_auto, q_auto, c_limit, and width tiers", () => {
		const publicId = "listings/test-123/car_front";

		// Default
		const defaultUrl = cloudinaryUrl(publicId);
		expect(defaultUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_limit/${publicId}`);

		// Thumbnail tier (200px)
		const thumbUrl = cloudinaryUrl(publicId, { width: "thumbnail" });
		expect(thumbUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_200,c_limit/${publicId}`);

		// Card tier (400px)
		const cardUrl = cloudinaryUrl(publicId, { width: "card" });
		expect(cardUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_400,c_limit/${publicId}`);

		// Detail tier (800px)
		const detailUrl = cloudinaryUrl(publicId, { width: "detail" });
		expect(detailUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_800,c_limit/${publicId}`);

		// Custom numeric width
		const customUrl = cloudinaryUrl(publicId, { width: 550, height: 350 });
		expect(customUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_550,h_350,c_limit/${publicId}`);

		// Strips full URL properly
		const fromFullUrl = cloudinaryUrl(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1234/${publicId}.jpg`, {
			width: "card",
		});
		expect(fromFullUrl).toBe(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_400,c_limit/${publicId}`);
	});

	// §6: Asset verification blocks mismatched folders and missing user tags
	test("7. verifyCloudinaryAsset rejects folder mismatch or unauthorized user tag", async () => {
		// Mock Cloudinary Admin API resource lookup
		const origResource = cloudinary.api.resource;
		// @ts-ignore
		cloudinary.api.resource = async (publicId: string) => {
			if (publicId === "listings/listing_123/valid_photo") {
				return {
					public_id: publicId,
					folder: "listings/listing_123",
					tags: [`user_${userA.id}`, "pending"],
				};
			}
			if (publicId === "listings/listing_123/wrong_user") {
				return {
					public_id: publicId,
					folder: "listings/listing_123",
					tags: ["user_other_user"],
				};
			}
			if (publicId === "profiles/user_456/photo") {
				return {
					public_id: publicId,
					folder: "profiles/user_456",
					tags: [`user_${userA.id}`],
				};
			}
			return null;
		};

		// 1. Valid asset
		const validResult = await verifyCloudinaryAsset("listings/listing_123/valid_photo", "listings/listing_123", userA.id);
		expect(validResult.verified).toBe(true);
		expect(validResult.url).toContain("f_auto,q_auto");

		// 2. Wrong ownership tag
		const tagMismatch = await verifyCloudinaryAsset("listings/listing_123/wrong_user", "listings/listing_123", userA.id);
		expect(tagMismatch.verified).toBe(false);
		expect(tagMismatch.error).toContain("Ownership mismatch");

		// 3. Folder mismatch
		const folderMismatch = await verifyCloudinaryAsset("profiles/user_456/photo", "listings/listing_123", userA.id);
		expect(folderMismatch.verified).toBe(false);
		expect(folderMismatch.error).toContain("Folder mismatch");

		// Restore
		cloudinary.api.resource = origResource;
	});

	// Edge Case 1: Photo replacement on listing update deletes removed asset
	test("8. PUT /api/listings/:id deletes removed Cloudinary photos from listing", async () => {
		const origGetSession = auth.api.getSession;
		// @ts-ignore
		auth.api.getSession = async () => ({ session: {}, user: userA });

		let deletedIds: string[] = [];
		const origDeleteResources = cloudinary.api.delete_resources;
		// @ts-ignore
		cloudinary.api.delete_resources = async (publicIds: string[]) => {
			deletedIds = publicIds;
			return { deleted: publicIds };
		};

		// Listing currently has photo1 and photo2. Update with only photo1 and new photo3.
		const res = await listingsApp.request(`/${listingAId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				media: [
					{ url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/listings/${testUuid}/photo1.jpg`, isPrimary: true },
					{ url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/listings/${testUuid}/photo3.jpg` },
				],
			}),
		});

		expect(res.status).toBe(200);
		// photo2 should be detected as removed and deleted
		expect(deletedIds).toContain(`listings/${testUuid}/photo2`);
		expect(deletedIds).not.toContain(`listings/${testUuid}/photo1`);

		cloudinary.api.delete_resources = origDeleteResources;
		auth.api.getSession = origGetSession;
	});

	// §7: Cascade delete on listing removal
	test("9. DELETE /api/listings/:id cascade-deletes Cloudinary folder for listing", async () => {
		const origGetSession = auth.api.getSession;
		// @ts-ignore
		auth.api.getSession = async () => ({ session: {}, user: userA });

		let deletedPrefix = "";
		const origDeletePrefix = cloudinary.api.delete_resources_by_prefix;
		// @ts-ignore
		cloudinary.api.delete_resources_by_prefix = async (prefix: string) => {
			deletedPrefix = prefix;
			return { deleted: {} };
		};

		const res = await listingsApp.request(`/${listingAId}`, {
			method: "DELETE",
		});

		expect(res.status).toBe(200);
		expect(deletedPrefix).toBe(`listings/${listingAId}`);

		cloudinary.api.delete_resources_by_prefix = origDeletePrefix;
		auth.api.getSession = origGetSession;
	});

	// §7: Orphaned pending assets cleanup
	test("10. cleanupStalePendingAssets finds and purges unattached pending assets older than cutoff", async () => {
		const now = Date.now();
		const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();
		const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

		const origResourcesByTag = cloudinary.api.resources_by_tag;
		const origDeleteResources = cloudinary.api.delete_resources;

		// @ts-ignore
		cloudinary.api.resources_by_tag = async () => ({
			resources: [
				{ public_id: "listings/draft_1/abandoned_photo", created_at: twentyFiveHoursAgo },
				{ public_id: "listings/draft_2/fresh_photo", created_at: twoHoursAgo },
			],
		});

		let deletedList: string[] = [];
		// @ts-ignore
		cloudinary.api.delete_resources = async (publicIds: string[]) => {
			deletedList = publicIds;
			return { deleted: publicIds };
		};

		const purgedCount = await cleanupStalePendingAssets(24);
		expect(purgedCount).toBe(1);
		expect(deletedList).toContain("listings/draft_1/abandoned_photo");
		expect(deletedList).not.toContain("listings/draft_2/fresh_photo");

		cloudinary.api.resources_by_tag = origResourcesByTag;
		cloudinary.api.delete_resources = origDeleteResources;
	});
});
