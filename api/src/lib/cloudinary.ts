import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "sayaratak";
const API_KEY = process.env.CLOUDINARY_API_KEY || "dummy_key";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "dummy_secret";

cloudinary.config({
	cloud_name: CLOUD_NAME,
	api_key: API_KEY,
	api_secret: API_SECRET,
	secure: true,
});

export { cloudinary, CLOUD_NAME, API_KEY, API_SECRET };

export type CloudinaryWidthTier = "thumbnail" | "card" | "detail" | "full" | number;

const WIDTH_TIERS: Record<string, number> = {
	thumbnail: 200,
	card: 400,
	detail: 800,
	full: 1200,
};

/**
 * Extracts public_id from a raw Cloudinary URL or returns the input if already a public_id.
 */
export function extractPublicId(urlOrPublicId: string): string {
	if (!urlOrPublicId) return "";
	if (!urlOrPublicId.includes("cloudinary.com")) return urlOrPublicId;

	// Strip URL up to /upload/(transforms/)?(v\d+/)?
	const match = urlOrPublicId.match(/\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?([^\.\?#]+)/);
	return match ? match[1] : urlOrPublicId;
}

/**
 * Standardizes delivery transformations across the entire application.
 * Ensures f_auto, q_auto, and c_limit are present on every delivery URL.
 */
export function cloudinaryUrl(
	publicIdOrUrl: string,
	opts: { width?: CloudinaryWidthTier; height?: number } = {}
): string {
	if (!publicIdOrUrl) return "";

	const publicId = extractPublicId(publicIdOrUrl);
	let widthValue: number | undefined;

	if (typeof opts.width === "string" && WIDTH_TIERS[opts.width]) {
		widthValue = WIDTH_TIERS[opts.width];
	} else if (typeof opts.width === "number") {
		widthValue = opts.width;
	}

	const transforms = [
		"f_auto", // optimal format per browser (WebP/AVIF)
		"q_auto", // optimal quality/compression
		widthValue ? `w_${widthValue}` : null,
		opts.height ? `h_${opts.height}` : null,
		"c_limit", // caps max dimensions without upscaling
	]
		.filter(Boolean)
		.join(",");

	return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export type SignUploadOptions = {
	userId: string;
	folder: string;
	timestamp?: number;
};

export type SignedUploadParams = {
	signature: string;
	timestamp: number;
	apiKey: string;
	cloudName: string;
	folder: string;
	eager: string;
	allowed_formats: string;
	tags: string;
};

/**
 * Generates Cloudinary signed upload parameters enforcing server-side compression
 * (eager transformation) and strict format restrictions.
 */
export function signUploadParams(options: SignUploadOptions): SignedUploadParams {
	const timestamp = options.timestamp || Math.round(Date.now() / 1000);
	const eager = "c_limit,w_2000,h_2000,q_auto,f_auto";
	const allowed_formats = "jpg,png,webp,jpeg,avif";
	const tags = `user_${options.userId},pending`;

	const paramsToSign: Record<string, any> = {
		allowed_formats,
		eager,
		folder: options.folder,
		tags,
		timestamp,
	};

	const signature = cloudinary.utils.api_sign_request(paramsToSign, API_SECRET);

	return {
		signature,
		timestamp,
		apiKey: API_KEY,
		cloudName: CLOUD_NAME,
		folder: options.folder,
		eager,
		allowed_formats,
		tags,
	};
}

/**
 * Verifies an uploaded asset against Cloudinary Admin API.
 * Ensures the asset exists, belongs to the expected folder prefix,
 * and carries the uploader's user ownership tag.
 */
export async function verifyCloudinaryAsset(
	publicId: string,
	expectedFolderPrefix: string,
	userId: string
): Promise<{ verified: boolean; url: string; error?: string }> {
	try {
		const cleanPublicId = extractPublicId(publicId);
		const asset = await cloudinary.api.resource(cleanPublicId);

		if (!asset) {
			return { verified: false, url: "", error: "Asset not found in Cloudinary" };
		}

		// Verify folder prefix
		const assetFolder = asset.folder || cleanPublicId.substring(0, cleanPublicId.lastIndexOf("/"));
		if (!assetFolder.startsWith(expectedFolderPrefix)) {
			return {
				verified: false,
				url: "",
				error: `Folder mismatch: expected prefix '${expectedFolderPrefix}', found '${assetFolder}'`,
			};
		}

		// Verify user ownership tag
		const tags: string[] = asset.tags || [];
		const expectedTag = `user_${userId}`;
		if (!tags.includes(expectedTag)) {
			return {
				verified: false,
				url: "",
				error: `Ownership mismatch: missing required tag '${expectedTag}'`,
			};
		}

		// Remove the temporary 'pending' tag since it is now verified and attached
		try {
			await cloudinary.uploader.remove_tag("pending", [cleanPublicId]);
		} catch (tagErr) {
			// Non-fatal if tag removal fails
		}

		return {
			verified: true,
			url: cloudinaryUrl(cleanPublicId),
		};
	} catch (err: any) {
		return { verified: false, url: "", error: err.message || "Cloudinary verification failed" };
	}
}

/**
 * Deletes specific resources by public_ids from Cloudinary.
 */
export async function deleteCloudinaryResources(publicIds: string[]): Promise<any> {
	if (!publicIds || publicIds.length === 0) return;
	const cleanIds = publicIds.map(extractPublicId).filter(Boolean);
	if (cleanIds.length === 0) return;

	try {
		return await cloudinary.api.delete_resources(cleanIds);
	} catch (err) {
		if (API_KEY !== "dummy_key") {
			console.error("Failed to delete Cloudinary resources:", err);
		}
	}
}

/**
 * Cascade-deletes all Cloudinary assets under a folder prefix, then removes the folder.
 */
export async function deleteCloudinaryFolder(folderPrefix: string): Promise<any> {
	if (!folderPrefix) return;

	try {
		// 1. Delete all resources in prefix
		await cloudinary.api.delete_resources_by_prefix(folderPrefix);
		// 2. Delete empty folder
		await cloudinary.api.delete_folder(folderPrefix).catch(() => {
			// Folder might not be immediately empty or may already be gone
		});
	} catch (err) {
		if (API_KEY !== "dummy_key") {
			console.error(`Failed to delete Cloudinary folder ${folderPrefix}:`, err);
		}
	}
}

/**
 * Scheduled job helper: Cleans up orphaned uploads tagged as 'pending'
 * that were never attached to any listing/profile and are older than maxAgeHours.
 */
export async function cleanupStalePendingAssets(maxAgeHours = 24): Promise<number> {
	try {
		// Query Cloudinary Admin API for resources with tag 'pending'
		const result = await cloudinary.api.resources_by_tag("pending", {
			max_results: 500,
		});

		const now = Date.now();
		const cutoffMs = maxAgeHours * 60 * 60 * 1000;
		const stalePublicIds: string[] = [];

		if (result && Array.isArray(result.resources)) {
			for (const res of result.resources) {
				const createdAt = new Date(res.created_at).getTime();
				if (now - createdAt > cutoffMs) {
					stalePublicIds.push(res.public_id);
				}
			}
		}

		if (stalePublicIds.length > 0) {
			await cloudinary.api.delete_resources(stalePublicIds);
		}

		return stalePublicIds.length;
	} catch (err) {
		console.error("Error in cleanupStalePendingAssets:", err);
		return 0;
	}
}

/**
 * Content Moderation Architecture Note:
 * Cloudinary supports automatic AI moderation add-ons (such as AWS Rekognition
 * and WebPurify) configured via `moderation: 'aws_rek'` or preset hooks.
 * This can be enabled in Phase 2 via upload presets when moderation policies are finalized.
 */
