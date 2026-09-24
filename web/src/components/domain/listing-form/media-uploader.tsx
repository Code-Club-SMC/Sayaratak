import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ListingMediaInput } from "@/lib/query-options/listings";
import {
	mediaSignature,
	uploadToCloudinary,
	verifyMediaAsset,
} from "@/lib/query-options/media";

type MediaUploaderProps = {
	listingId: string;
	value: ListingMediaInput[];
	onChange: (next: ListingMediaInput[]) => void;
	disabled?: boolean;
	locale?: string;
};

type UploadState = {
	id: string;
	fileName: string;
	status: "uploading" | "verified" | "failed";
	message?: string;
};

function mediaUrl(item: ListingMediaInput): string {
	return typeof item === "string" ? item : item.url;
}

function normalizeMedia(value: ListingMediaInput[]): ListingMediaInput[] {
	const hasPrimary = value.some(
		(item) => typeof item !== "string" && item.isPrimary,
	);

	if (hasPrimary || value.length === 0) return value;

	const [first, ...rest] = value;
	return [
		typeof first === "string"
			? { url: first, isPrimary: true }
			: { ...first, isPrimary: true },
		...rest,
	];
}

export function MediaUploader({
	listingId,
	value,
	onChange,
	disabled,
	locale = "en",
}: MediaUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploads, setUploads] = useState<UploadState[]>([]);
	const isUploading = uploads.some((item) => item.status === "uploading");

	async function uploadFile(file: File) {
		const uploadId = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
		setUploads((current) => [
			...current,
			{ id: uploadId, fileName: file.name, status: "uploading" },
		]);

		try {
			const signature = await mediaSignature("listing", listingId);
			const cloudinaryResult = await uploadToCloudinary(file, signature);
			const publicId = cloudinaryResult.public_id;

			if (!publicId) {
				throw new Error("Cloudinary did not return a public id");
			}

			const verified = await verifyMediaAsset("listing", listingId, publicId);
			const next = normalizeMedia([
				...value,
				{
					url: verified.url,
					publicId: verified.publicId,
				},
			]);

			onChange(next);
			setUploads((current) =>
				current.map((item) =>
					item.id === uploadId
						? { ...item, status: "verified", message: verified.url }
						: item,
				),
			);
		} catch (error) {
			setUploads((current) =>
				current.map((item) =>
					item.id === uploadId
						? {
								...item,
								status: "failed",
								message:
									error instanceof Error
										? error.message
										: "Image upload failed",
							}
						: item,
				),
			);
		}
	}

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			if (!file.type.startsWith("image/")) {
				setUploads((current) => [
					...current,
					{
						fileName: file.name,
						id: `${file.name}-${file.lastModified}-invalid`,
						status: "failed",
						message:
							locale === "ar"
								? "يسمح برفع الصور فقط."
								: "Only image files are allowed.",
					},
				]);
				continue;
			}

			await uploadFile(file);
		}

		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}

	function removeMedia(index: number) {
		onChange(
			normalizeMedia(value.filter((_, itemIndex) => itemIndex !== index)),
		);
	}

	function markPrimary(index: number) {
		onChange(
			value.map((item, itemIndex) =>
				typeof item === "string"
					? { url: item, isPrimary: itemIndex === index }
					: { ...item, isPrimary: itemIndex === index },
			),
		);
	}

	return (
		<section className="space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-base font-semibold tracking-normal">
						{locale === "ar" ? "صور الإعلان" : "Listing photos"}
					</h2>
					<p className="text-xs text-muted-foreground">
						{locale === "ar"
							? "ترفع الصور بتوقيع آمن مرتبط بهذا الإعلان."
							: "Photos are uploaded with a secure signature scoped to this listing."}
					</p>
				</div>
				<div>
					<input
						ref={inputRef}
						accept="image/*"
						className="sr-only"
						disabled={disabled || isUploading}
						id="listing-media-upload"
						multiple
						type="file"
						onChange={(event) => void handleFiles(event.target.files)}
					/>
					<Button
						type="button"
						disabled={disabled || isUploading}
						onClick={() => inputRef.current?.click()}
					>
						{isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
						{locale === "ar" ? "رفع الصور" : "Upload photos"}
					</Button>
				</div>
			</div>

			{!listingId ? (
				<Alert>
					<ImagePlus />
					<AlertTitle>
						{locale === "ar" ? "احفظ المسودة أولاً" : "Save draft first"}
					</AlertTitle>
					<AlertDescription>
						{locale === "ar"
							? "يجب إنشاء الإعلان قبل رفع الصور."
							: "A listing must exist before photos can be uploaded."}
					</AlertDescription>
				</Alert>
			) : null}

			{value.length > 0 ? (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{value.map((item, index) => {
						const url = mediaUrl(item);
						const isPrimary = typeof item !== "string" && item.isPrimary;

						return (
							<div
								key={url}
								className="overflow-hidden rounded-md border border-border bg-card"
							>
								<div className="aspect-4/3 bg-muted">
									<img
										src={url}
										alt={locale === "ar" ? "صورة الإعلان" : "Listing media"}
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="flex items-center justify-between gap-2 p-2">
									<Button
										type="button"
										size="sm"
										variant={isPrimary ? "secondary" : "ghost"}
										onClick={() => markPrimary(index)}
									>
										{isPrimary
											? locale === "ar"
												? "رئيسية"
												: "Primary"
											: locale === "ar"
												? "تعيين"
												: "Set"}
									</Button>
									<Button
										type="button"
										size="icon-sm"
										variant="ghost"
										aria-label={locale === "ar" ? "حذف الصورة" : "Remove photo"}
										onClick={() => removeMedia(index)}
									>
										<Trash2 />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="flex min-h-44 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
					<div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
						<ImagePlus className="size-6" />
						<span>{locale === "ar" ? "لا توجد صور بعد" : "No photos yet"}</span>
					</div>
				</div>
			)}

			{uploads.length > 0 ? (
				<div className="space-y-2">
					{uploads.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-xs"
						>
							<span className="min-w-0 truncate">{item.fileName}</span>
							<span
								className={
									item.status === "failed"
										? "text-destructive"
										: "text-muted-foreground"
								}
							>
								{item.status === "uploading"
									? locale === "ar"
										? "جار الرفع"
										: "Uploading"
									: item.status === "verified"
										? locale === "ar"
											? "تم التحقق"
											: "Verified"
										: item.message}
							</span>
						</div>
					))}
				</div>
			) : null}
		</section>
	);
}
