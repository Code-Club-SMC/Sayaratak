import { apiPost } from "@/lib/api";

export type MediaEntityType = "listing" | "profile" | "page";

export type MediaUploadSignature = {
	signature: string;
	timestamp: number;
	apiKey: string;
	cloudName: string;
	folder: string;
	eager: string;
	allowed_formats: string;
	tags: string;
};

export type VerifiedMediaAsset = {
	success?: boolean;
	url: string;
	publicId: string;
	isPrimary?: boolean;
};

export type CloudinaryUploadResult = {
	secure_url?: string;
	url?: string;
	public_id?: string;
};

export const mediaSignature = (entityType: MediaEntityType, entityId: string) =>
	apiPost<MediaUploadSignature>("/api/v1/media/signature", {
		entityType,
		entityId,
	});

export const verifyMediaAsset = (
	entityType: MediaEntityType,
	entityId: string,
	publicId: string,
) =>
	apiPost<VerifiedMediaAsset>("/api/v1/media/verify", {
		entityType,
		entityId,
		publicId,
	});

export async function uploadToCloudinary(
	file: File,
	signature: MediaUploadSignature,
): Promise<CloudinaryUploadResult> {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("api_key", signature.apiKey);
	formData.set("timestamp", String(signature.timestamp));
	formData.set("signature", signature.signature);
	formData.set("folder", signature.folder);
	formData.set("eager", signature.eager);
	formData.set("allowed_formats", signature.allowed_formats);
	formData.set("tags", signature.tags);

	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
		{ method: "POST", body: formData },
	);

	const data = (await response.json()) as CloudinaryUploadResult & {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(data.error?.message ?? "Cloudinary upload failed");
	}

	return data;
}
