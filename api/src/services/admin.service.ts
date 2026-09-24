import { eq, and, ne, desc, sql } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { db } from "../db";
import { auth } from "../../lib/auth";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { payments, subscriptionPackages, userSubscriptions } from "../db/schemas/monetization-schema";
import { banners, pages } from "../db/schemas/content-schema";
import { listings } from "../db/schemas/listing-schema";
import { user } from "../db/schemas/auth-schema";
import { categories } from "../db/schemas/taxonomy-schema";
import { notifications } from "../db/schemas/communication-schema";
import { reports } from "../db/schemas/social-schema";
import { deleteCloudinaryResources } from "../lib/cloudinary";
import { sendPushNotification } from "../lib/fcm";
import {
	NotFoundError,
	ForbiddenError,
	BadRequestError,
	ConflictError,
	AppError,
} from "../lib/errors";
import type {
	CreateAdminInput,
	CreateBannerInput,
	UpdateBannerInput,
	CreatePageInput,
	UpdatePageInput,
	GetUsersQuery,
	GetAdminListingsQuery,
} from "../schemas";

const profileTableMap = {
	dealership: dealerships,
	workshop: workshops,
	mechanic: mechanics,
} as const;

export const PROTECTED_SLUGS = ["privacy-policy", "terms-and-conditions"] as const;

export function sanitizePageContent(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: [
			"h1", "h2", "h3", "h4", "h5", "h6",
			"p", "br", "strong", "em", "b", "i", "u",
			"ul", "ol", "li", "a", "blockquote", "hr",
			"table", "thead", "tbody", "tr", "th", "td",
			"span", "code", "pre",
		],
		allowedAttributes: {
			a: ["href", "target", "rel", "title"],
			"*": ["class", "dir", "lang"],
		},
		allowedSchemes: ["http", "https", "mailto", "tel"],
	});
}

const pageResponseFields = {
	id: pages.id,
	slug: pages.slug,
	title: pages.title,
	titleAr: pages.titleAr,
	content: pages.content,
	contentAr: pages.contentAr,
	isActive: pages.isActive,
	updatedBy: pages.updatedBy,
	createdAt: pages.createdAt,
	updatedAt: pages.updatedAt,
};

const bannerResponseFields = {
	id: banners.id,
	title: banners.title,
	imageUrl: banners.imageUrl,
	targetUrl: banners.targetUrl,
	placement: banners.placement,
	startDate: banners.startDate,
	endDate: banners.endDate,
	isActive: banners.isActive,
	updatedBy: banners.updatedBy,
	createdAt: banners.createdAt,
	updatedAt: banners.updatedAt,
};

export const adminService = {
	async createAdmin(input: CreateAdminInput) {
		try {
			const result = await auth.api.createUser({
				body: {
					email: input.email,
					password: input.password,
					name: input.name,
					role: "admin",
					data: { accountType: "user" },
				},
			});

			const createdUser = (result as { user: { id: string; email: string; name: string } }).user;

			return {
				id: createdUser.id,
				email: createdUser.email,
				name: createdUser.name,
				role: "admin",
			};
		} catch (err: unknown) {
			if (err instanceof AppError) throw err;
			const status = (err instanceof Error && "status" in err ? Number((err as { status: number }).status) : 400);
			const message = err instanceof Error ? err.message : "Failed to create admin";
			throw new AppError(message, status, "CREATE_ADMIN_FAILED");
		}
	},

	async verifyProfile(type: string, id: string, isVerified: boolean) {
		const table = profileTableMap[type as keyof typeof profileTableMap];
		if (!table) {
			throw new BadRequestError("Invalid profile type", "INVALID_PROFILE_TYPE");
		}

		const [updated] = await db
			.update(table)
			.set({ isVerified, updatedAt: new Date() })
			.where(eq(table.id, id))
			.returning({
				id: table.id,
				isVerified: table.isVerified,
				updatedAt: table.updatedAt,
			});

		if (!updated) {
			throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
		}

		return updated;
	},

	async approvePayment(id: string, status: "completed" | "failed") {
		const [payment] = await db.select().from(payments).where(eq(payments.id, id));
		if (!payment) {
			throw new NotFoundError("Payment not found", "PAYMENT_NOT_FOUND");
		}
		if (payment.status !== "pending") {
			throw new BadRequestError("Payment already processed", "PAYMENT_ALREADY_PROCESSED");
		}

		const [updated] = await db
			.update(payments)
			.set({ status, updatedAt: new Date() })
			.where(eq(payments.id, id))
			.returning({
				id: payments.id,
				userId: payments.userId,
				amount: payments.amount,
				currency: payments.currency,
				status: payments.status,
				purpose: payments.purpose,
				referenceId: payments.referenceId,
				updatedAt: payments.updatedAt,
			});

		if (status === "completed" && payment.purpose === "subscription" && payment.referenceId) {
			const [pkg] = await db
				.select()
				.from(subscriptionPackages)
				.where(eq(subscriptionPackages.id, payment.referenceId));
			if (pkg) {
				const [existingSub] = await db
					.select()
					.from(userSubscriptions)
					.where(eq(userSubscriptions.userId, payment.userId));

				if (existingSub) {
					const baseDate = existingSub.endDate > new Date() ? existingSub.endDate : new Date();
					const endDate = new Date(baseDate);
					endDate.setDate(endDate.getDate() + pkg.durationDays);
					await db
						.update(userSubscriptions)
						.set({ packageId: pkg.id, endDate, status: "active", updatedAt: new Date() })
						.where(eq(userSubscriptions.id, existingSub.id));
				} else {
					const endDate = new Date();
					endDate.setDate(endDate.getDate() + pkg.durationDays);
					await db.insert(userSubscriptions).values({
						userId: payment.userId,
						packageId: pkg.id,
						status: "active",
						startDate: new Date(),
						endDate,
					});
				}
			}
		}

		if (status === "completed" && payment.purpose === "featured_listing" && payment.referenceId) {
			await db
				.update(listings)
				.set({ isFeatured: true, updatedAt: new Date() })
				.where(eq(listings.id, payment.referenceId));
		}

		return updated;
	},

	async broadcastNotification(target: string, title: string, msgBody: string) {
		let usersList;
		if (target !== "all") {
			usersList = await db.select({ id: user.id }).from(user).where(eq(user.accountType, target));
		} else {
			usersList = await db.select({ id: user.id }).from(user);
		}
		if (usersList.length === 0) {
			throw new NotFoundError("No users found for target", "NO_USERS_FOUND");
		}

		const notifsToInsert = usersList.map((u) => ({
			userId: u.id,
			title,
			body: msgBody,
			type: "system",
		}));

		await db.insert(notifications).values(notifsToInsert);

		setTimeout(async () => {
			for (const u of usersList) {
				await sendPushNotification(u.id, title, msgBody, { type: "system" });
			}
		}, 0);

		return { success: true, count: usersList.length };
	},

	async listBanners() {
		return db
			.select({
				id: banners.id,
				title: banners.title,
				imageUrl: banners.imageUrl,
				targetUrl: banners.targetUrl,
				placement: banners.placement,
				startDate: banners.startDate,
				endDate: banners.endDate,
				isActive: banners.isActive,
				createdAt: banners.createdAt,
				updatedAt: banners.updatedAt,
			})
			.from(banners);
	},

	async createBanner(body: CreateBannerInput, userId?: string) {
		const [created] = await db
			.insert(banners)
			.values({
				title: body.title,
				imageUrl: body.imageUrl,
				targetUrl: body.targetUrl,
				placement: body.placement || "home_top",
				startDate: body.startDate ? new Date(body.startDate) : new Date(),
				endDate: new Date(body.endDate),
				isActive: body.isActive ?? true,
				updatedBy: userId,
			})
			.returning(bannerResponseFields);

		return created;
	},

	async updateBanner(id: string, body: UpdateBannerInput, userId?: string) {
		const [updated] = await db
			.update(banners)
			.set({
				...body,
				startDate: body.startDate ? new Date(body.startDate) : undefined,
				endDate: body.endDate ? new Date(body.endDate) : undefined,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(banners.id, id))
			.returning(bannerResponseFields);

		if (!updated) {
			throw new NotFoundError("Banner not found", "BANNER_NOT_FOUND");
		}
		return updated;
	},

	async deleteBanner(id: string) {
		const [deleted] = await db.delete(banners).where(eq(banners.id, id)).returning();
		if (!deleted) {
			throw new NotFoundError("Banner not found", "BANNER_NOT_FOUND");
		}

		if (deleted.imageUrl) {
			await deleteCloudinaryResources([deleted.imageUrl]).catch((err: any) =>
				console.error(`[Banner] Failed to clean up Cloudinary asset for banner ${id}:`, err),
			);
		}

		return { success: true };
	},

	async listPages() {
		return db.select(pageResponseFields).from(pages);
	},

	async getPageById(id: string) {
		const [page] = await db.select(pageResponseFields).from(pages).where(eq(pages.id, id));
		if (!page) {
			throw new NotFoundError("Page not found", "PAGE_NOT_FOUND");
		}
		return page;
	},

	async createPage(body: CreatePageInput, userId?: string) {
		const [existing] = await db.select().from(pages).where(eq(pages.slug, body.slug));
		if (existing) {
			throw new ConflictError("Page with this slug already exists", "SLUG_ALREADY_EXISTS");
		}

		const sanitizedContent = sanitizePageContent(body.content);
		const sanitizedContentAr = body.contentAr ? sanitizePageContent(body.contentAr) : null;

		const [created] = await db
			.insert(pages)
			.values({
				slug: body.slug,
				title: body.title,
				titleAr: body.titleAr ?? null,
				content: sanitizedContent,
				contentAr: sanitizedContentAr,
				isActive: body.isActive ?? true,
				updatedBy: userId,
			})
			.returning(pageResponseFields);

		return created;
	},

	async updatePage(id: string, body: UpdatePageInput, userId?: string) {
		const [target] = await db.select().from(pages).where(eq(pages.id, id));
		if (!target) {
			throw new NotFoundError("Page not found", "PAGE_NOT_FOUND");
		}

		if (body.slug && body.slug !== target.slug) {
			const [existing] = await db
				.select()
				.from(pages)
				.where(and(eq(pages.slug, body.slug), ne(pages.id, id)));
			if (existing) {
				throw new ConflictError("Slug already in use", "SLUG_ALREADY_IN_USE");
			}
		}

		const finalIsActive = body.isActive !== undefined ? body.isActive : target.isActive;
		const finalTitleAr = body.titleAr !== undefined ? body.titleAr : target.titleAr;
		const finalContentAr = body.contentAr !== undefined ? body.contentAr : target.contentAr;

		if (finalIsActive && (!finalTitleAr || !finalContentAr)) {
			throw new BadRequestError(
				"Cannot activate a page with missing Arabic content.",
				"INCOMPLETE_BILINGUAL_CONTENT",
			);
		}

		const sanitizedContent =
			body.content !== undefined ? sanitizePageContent(body.content) : undefined;
		const sanitizedContentAr =
			body.contentAr !== undefined
				? body.contentAr === null
					? null
					: sanitizePageContent(body.contentAr)
				: undefined;

		const [updated] = await db
			.update(pages)
			.set({
				...body,
				...(sanitizedContent !== undefined ? { content: sanitizedContent } : {}),
				...(sanitizedContentAr !== undefined ? { contentAr: sanitizedContentAr } : {}),
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(eq(pages.id, id))
			.returning(pageResponseFields);

		return updated;
	},

	async deletePage(id: string, userId?: string) {
		const [target] = await db.select().from(pages).where(eq(pages.id, id));
		if (!target) {
			throw new NotFoundError("Page not found", "PAGE_NOT_FOUND");
		}

		if (PROTECTED_SLUGS.includes(target.slug as (typeof PROTECTED_SLUGS)[number])) {
			throw new ForbiddenError(
				"This page cannot be deleted. Deactivate it instead.",
				"PAGE_PROTECTED",
			);
		}

		const [updated] = await db
			.update(pages)
			.set({
				isActive: false,
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(eq(pages.id, id))
			.returning(pageResponseFields);

		return { success: true, page: updated };
	},

	async listUsers(query: GetUsersQuery) {
		const offset = (query.page - 1) * query.limit;

		return db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				accountType: user.accountType,
				banned: user.banned,
				banReason: user.banReason,
				createdAt: user.createdAt,
			})
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(query.limit)
			.offset(offset);
	},

	async banUser(id: string, banned: boolean, banReason?: string) {
		const [updatedUser] = await db
			.update(user)
			.set({ banned, banReason: banned ? banReason : null })
			.where(eq(user.id, id))
			.returning({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				accountType: user.accountType,
				banned: user.banned,
				banReason: user.banReason,
				updatedAt: user.updatedAt,
			});

		if (!updatedUser) {
			throw new NotFoundError("User not found", "USER_NOT_FOUND");
		}

		if (banned) {
			await db
				.update(listings)
				.set({ status: "banned" })
				.where(eq(listings.userId, id));
		}

		return updatedUser;
	},

	async listListings(query: GetAdminListingsQuery) {
		const offset = (query.page - 1) * query.limit;

		const listingProjection = {
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

		if (query.status) {
			return db
				.select(listingProjection)
				.from(listings)
				.where(eq(listings.status, query.status))
				.limit(query.limit)
				.offset(offset);
		}

		return db
			.select(listingProjection)
			.from(listings)
			.limit(query.limit)
			.offset(offset);
	},

	async moderateListing(id: string, status: string) {
		const [updated] = await db
			.update(listings)
			.set({ status, updatedAt: new Date() })
			.where(eq(listings.id, id))
			.returning({
				id: listings.id,
				userId: listings.userId,
				status: listings.status,
				title: listings.title,
				updatedAt: listings.updatedAt,
			});

		if (!updated) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		return updated;
	},

	async getMetrics() {
		const [{ totalUsers }] = await db
			.select({ totalUsers: sql<number>`count(*)::int` })
			.from(user);

		const [{ totalDealerships }] = await db
			.select({ totalDealerships: sql<number>`count(*)::int` })
			.from(user)
			.where(eq(user.accountType, "dealership"));

		const [{ totalWorkshops }] = await db
			.select({ totalWorkshops: sql<number>`count(*)::int` })
			.from(user)
			.where(eq(user.accountType, "workshop"));

		const [{ totalMechanics }] = await db
			.select({ totalMechanics: sql<number>`count(*)::int` })
			.from(user)
			.where(eq(user.accountType, "mechanic"));

		const [{ totalListings }] = await db
			.select({ totalListings: sql<number>`count(*)::int` })
			.from(listings);

		const [{ totalVehicles }] = await db
			.select({ totalVehicles: sql<number>`count(*)::int` })
			.from(listings)
			.innerJoin(categories, eq(listings.categoryId, categories.id))
			.where(sql`${categories.slug} NOT LIKE '%part%'`);

		const [{ totalSubscriptions }] = await db
			.select({ totalSubscriptions: sql<number>`count(*)::int` })
			.from(userSubscriptions)
			.where(eq(userSubscriptions.status, "active"));

		const [{ revenue }] = await db
			.select({ revenue: sql<number>`COALESCE(sum(${payments.amount}), 0)::int` })
			.from(payments)
			.where(eq(payments.status, "completed"));

		const [{ pendingReports }] = await db
			.select({ pendingReports: sql<number>`count(*)::int` })
			.from(reports)
			.where(eq(reports.status, "pending"));

		const [{ pendingPayments }] = await db
			.select({ pendingPayments: sql<number>`count(*)::int` })
			.from(payments)
			.where(eq(payments.status, "pending"));

		return {
			totalUsers,
			totalDealerships,
			totalWorkshops,
			totalMechanics,
			totalListings,
			totalVehicles,
			totalSubscriptions,
			revenue,
			pendingReports,
			pendingPayments,
		};
	},
};
