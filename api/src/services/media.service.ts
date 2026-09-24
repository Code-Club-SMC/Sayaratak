import { eq } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { ForbiddenError } from "../lib/errors";
import { signUploadParams, verifyCloudinaryAsset, type SignedUploadParams } from "../lib/cloudinary";
import type { SessionUser } from "../middleware/auth";
import type { SignatureInput, VerifyMediaInput } from "../schemas";

export const mediaService = {
	async generateSignature(user: SessionUser, input: SignatureInput): Promise<SignedUploadParams> {
		const { entityType, entityId } = input;
		let resolvedFolder = "";

		if (entityType === "listing") {
			const [existingListing] = await db
				.select({ id: listings.id, userId: listings.userId })
				.from(listings)
				.where(eq(listings.id, entityId));

			if (existingListing && existingListing.userId !== user.id && user.role !== "admin") {
				throw new ForbiddenError("Forbidden: You do not own this listing", "FORBIDDEN");
			}

			resolvedFolder = `listings/${entityId}`;
		} else if (entityType === "profile") {
			if (entityId !== user.id && user.role !== "admin") {
				throw new ForbiddenError("Forbidden: You can only upload to your own profile", "FORBIDDEN");
			}
			resolvedFolder = `profiles/${user.id}`;
		} else if (entityType === "page") {
			if (user.role !== "admin") {
				throw new ForbiddenError("Forbidden: Admin role required for CMS assets", "FORBIDDEN");
			}
			resolvedFolder = `pages/${entityId}`;
		}

		return signUploadParams({
			userId: user.id,
			folder: resolvedFolder,
		});
	},

	async verifyAsset(user: SessionUser, input: VerifyMediaInput) {
		const { publicId, entityType, entityId } = input;

		let expectedFolderPrefix = "";
		if (entityType === "listing") {
			expectedFolderPrefix = `listings/${entityId}`;
		} else if (entityType === "profile") {
			expectedFolderPrefix = `profiles/${user.id}`;
		} else if (entityType === "page") {
			if (user.role !== "admin") {
				throw new ForbiddenError("Forbidden: Admin role required for CMS assets", "FORBIDDEN");
			}
			expectedFolderPrefix = `pages/${entityId}`;
		}

		const result = await verifyCloudinaryAsset(publicId, expectedFolderPrefix, user.id);

		if (!result.verified) {
			throw new ForbiddenError(result.error || "Invalid or unauthorized asset", "ASSET_VERIFICATION_FAILED");
		}

		return {
			success: true,
			publicId,
			url: result.url,
		};
	},
};
