import { z } from "zod";
import { slugRegex } from "./common";

export const createAdminSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1, "password is required"),
	name: z.string().min(1, "name is required"),
});

export const verifyProfileSchema = z.object({
	isVerified: z.boolean(),
});

export const approvePaymentSchema = z.object({
	status: z.enum(["completed", "failed"]),
});

export const broadcastSchema = z.object({
	target: z.enum(["all", "user", "dealership", "workshop", "mechanic"]),
	title: z.string().min(1),
	body: z.string().min(1),
});

export const createBannerSchema = z.object({
	title: z.string().min(1, "title is required"),
	imageUrl: z.string().min(1, "imageUrl is required"),
	targetUrl: z.string().optional().nullable(),
	placement: z.string().default("home_top"),
	startDate: z.string().or(z.date()).optional(),
	endDate: z.string().or(z.date()),
	isActive: z.boolean().default(true),
});

export const updateBannerSchema = createBannerSchema.partial();

export const createPageSchema = z
	.object({
		slug: z
			.string()
			.regex(
				slugRegex,
				'Slug must be lowercase letters, numbers, and hyphens only (e.g. "about-us")'
			),
		title: z.string().min(1, "Title is required"),
		titleAr: z.string().min(1, "Arabic title cannot be empty").nullable().optional(),
		content: z.string().min(1, "Content is required"),
		contentAr: z.string().min(1, "Arabic content cannot be empty").nullable().optional(),
		isActive: z.boolean().default(true),
	})
	.superRefine((data, ctx) => {
		if (data.isActive && (!data.titleAr || !data.contentAr)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["isActive"],
				message: "Cannot activate a page with missing Arabic content.",
			});
		}
	});

export const updatePageSchema = z.object({
	slug: z
		.string()
		.regex(
			slugRegex,
			'Slug must be lowercase letters, numbers, and hyphens only (e.g. "about-us")'
		)
		.optional(),
	title: z.string().min(1, "Title cannot be empty").optional(),
	titleAr: z.string().min(1, "Arabic title cannot be empty").nullable().optional(),
	content: z.string().min(1, "Content cannot be empty").optional(),
	contentAr: z.string().min(1, "Arabic content cannot be empty").nullable().optional(),
	isActive: z.boolean().optional(),
});

export const getUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const banUserSchema = z.object({
	banned: z.boolean(),
	banReason: z.string().optional().nullable(),
});

export const getAdminListingsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.string().optional(),
});

export const moderateListingSchema = z.object({
	status: z.enum(["available", "pending", "rejected", "banned"]),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type VerifyProfileInput = z.infer<typeof verifyProfileSchema>;
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type GetAdminListingsQuery = z.infer<typeof getAdminListingsQuerySchema>;
export type ModerateListingInput = z.infer<typeof moderateListingSchema>;
