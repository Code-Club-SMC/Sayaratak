import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";
import {
	signUploadParams,
	verifyCloudinaryAsset,
	cloudinaryUrl,
	type SignedUploadParams,
} from "../lib/cloudinary";

export const mediaApp = new Hono();

// -------------------------------------------------------------
// Per-user Rate Limiting for Signature Requests (30 reqs/min)
// -------------------------------------------------------------
const signatureRateLimits = new Map<string, { count: number; resetAt: number }>();
const SIGNATURE_LIMIT = 30;
const SIGNATURE_WINDOW_MS = 60 * 1000;

function checkSignatureRateLimit(userId: string): boolean {
	const now = Date.now();
	let record = signatureRateLimits.get(userId);

	if (!record || record.resetAt < now) {
		record = { count: 0, resetAt: now + SIGNATURE_WINDOW_MS };
	}

	record.count++;
	signatureRateLimits.set(userId, record);

	return record.count <= SIGNATURE_LIMIT;
}

export function resetSignatureRateLimits() {
	signatureRateLimits.clear();
}

// -------------------------------------------------------------
// Request Validation Schemas
// -------------------------------------------------------------
const signatureSchema = z.object({
	entityType: z.enum(["listing", "profile", "page"]),
	entityId: z.string().min(1),
});

const verifySchema = z.object({
	publicId: z.string().min(1),
	entityType: z.enum(["listing", "profile", "page"]),
	entityId: z.string().min(1),
});

// =============================================================
// 1. POST /api/v1/media/signature (Authenticated & Rate-limited)
// =============================================================
mediaApp.post("/signature", zValidator("json", signatureSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const userId = session.user.id;
	const userRole = session.user.role;

	// §5: Enforce rate limit per user
	if (!checkSignatureRateLimit(userId)) {
		return c.json({ error: "Too Many Requests. Signature rate limit exceeded.", code: "RATE_LIMIT_EXCEEDED" }, 429);
	}

	const { entityType, entityId } = c.req.valid("json");
	let resolvedFolder = "";

	// §6 & Edge Case: Enforce entity ownership at signature-request time
	if (entityType === "listing") {
		// Check if listing already exists in database
		const [existingListing] = await db
			.select({ id: listings.id, userId: listings.userId })
			.from(listings)
			.where(eq(listings.id, entityId));

		if (existingListing && existingListing.userId !== userId && userRole !== "admin") {
			return c.json({ error: "Forbidden: You do not own this listing", code: "FORBIDDEN" }, 403);
		}

		resolvedFolder = `listings/${entityId}`;
	} else if (entityType === "profile") {
		// Users can only upload to their own profile folder unless admin
		if (entityId !== userId && userRole !== "admin") {
			return c.json({ error: "Forbidden: You can only upload to your own profile", code: "FORBIDDEN" }, 403);
		}
		resolvedFolder = `profiles/${userId}`;
	} else if (entityType === "page") {
		// CMS uploads require admin role
		if (userRole !== "admin") {
			return c.json({ error: "Forbidden: Admin role required for CMS assets", code: "FORBIDDEN" }, 403);
		}
		resolvedFolder = `pages/${entityId}`;
	}

	const signedParams: SignedUploadParams = signUploadParams({
		userId,
		folder: resolvedFolder,
	});

	return c.json(signedParams);
});

// =============================================================
// 2. POST /api/v1/media/verify (Verifies upload before attaching)
// =============================================================
mediaApp.post("/verify", zValidator("json", verifySchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const userId = session.user.id;
	const { publicId, entityType, entityId } = c.req.valid("json");

	let expectedFolderPrefix = "";
	if (entityType === "listing") {
		expectedFolderPrefix = `listings/${entityId}`;
	} else if (entityType === "profile") {
		expectedFolderPrefix = `profiles/${userId}`;
	} else if (entityType === "page") {
		if (session.user.role !== "admin") {
			return c.json({ error: "Forbidden: Admin role required for CMS assets", code: "FORBIDDEN" }, 403);
		}
		expectedFolderPrefix = `pages/${entityId}`;
	}

	const result = await verifyCloudinaryAsset(publicId, expectedFolderPrefix, userId);

	if (!result.verified) {
		return c.json({ error: result.error || "Invalid or unauthorized asset", code: "ASSET_VERIFICATION_FAILED" }, 403);
	}

	return c.json({
		success: true,
		publicId,
		url: result.url,
	});
});
