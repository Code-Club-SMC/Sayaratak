import { Hono } from "hono";
import { auth } from "../../lib/auth";
import { db } from "../db";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { payments, subscriptionPackages, userSubscriptions } from "../db/schemas/monetization-schema";
import { banners, pages } from "../db/schemas/content-schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import sanitizeHtml from "sanitize-html";
import { deleteCloudinaryResources, extractPublicId } from "../lib/cloudinary";

const profileTableMap = {
  dealership: dealerships,
  workshop: workshops,
  mechanic: mechanics,
} as const;

export const adminApp = new Hono();

// §1: Zod schemas for admin endpoints that previously used manual parsing
const createAdminSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1, "password is required"),
	name: z.string().min(1, "name is required"),
});

const verifyProfileSchema = z.object({
	isVerified: z.boolean(),
});

const approvePaymentSchema = z.object({
	status: z.enum(["completed", "failed"]),
});

const broadcastSchema = z.object({
	target: z.enum(["all", "user", "dealership", "workshop", "mechanic"]),
	title: z.string().min(1),
	body: z.string().min(1),
});

adminApp.post("/create", async (c) => {
	const secretKey = c.req.header("x-secret-key");
	if (!secretKey || secretKey !== process.env.ADMIN_CREATE_SECRET) {
		return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
	}

	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
	}

	const parsed = createAdminSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", code: "VALIDATION_FAILED", details: parsed.error.format() }, 400);
	}

	const { email, password, name } = parsed.data;

	try {
		const result = await auth.api.createUser({
			body: {
				email,
				password,
				name,
				role: "admin",
				data: { accountType: "user" },
			},
		});

		const user = (result as { user: { id: string; email: string; name: string } }).user;

		return c.json(
			{
				id: user.id,
				email: user.email,
				name: user.name,
				role: "admin",
			},
			201,
		);
	} catch (err: unknown) {
		const status = (err instanceof Error && "status" in err ? Number((err as { status: number }).status) : 400) as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;
		const message = err instanceof Error ? err.message : "Failed to create admin";
		return c.json({ error: message, code: "CREATE_ADMIN_FAILED" }, status);
	}
});

adminApp.patch("/profiles/:type/:id/verify", zValidator("json", verifyProfileSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const type = c.req.param("type");
	const id = c.req.param("id");
	const { isVerified } = c.req.valid("json");

	const table = profileTableMap[type as keyof typeof profileTableMap];
	if (!table) return c.json({ error: "Invalid profile type", code: "INVALID_PROFILE_TYPE" }, 400);
	const [updated] = await db
		.update(table)
		.set({ isVerified, updatedAt: new Date() })
		.where(eq(table.id, id))
		.returning({
			id: table.id,
			isVerified: table.isVerified,
			updatedAt: table.updatedAt,
		});

	if (!updated) return c.json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" }, 404);

	return c.json(updated);
});

adminApp.patch("/payments/:id/approve", zValidator("json", approvePaymentSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const id = c.req.param("id");
	const { status } = c.req.valid("json");

	const [payment] = await db.select().from(payments).where(eq(payments.id, id));
	if (!payment) return c.json({ error: "Payment not found", code: "PAYMENT_NOT_FOUND" }, 404);
	if (payment.status !== "pending") return c.json({ error: "Payment already processed", code: "PAYMENT_ALREADY_PROCESSED" }, 400);

	const [updated] = await db.update(payments)
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
		const [pkg] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, payment.referenceId));
		if (pkg) {
			// Try to find existing active sub first
			const [existingSub] = await db.select().from(userSubscriptions)
			  .where(eq(userSubscriptions.userId, payment.userId));
			
			if (existingSub) {
			  // Add duration to the later of: existing end date or today
			  const baseDate = existingSub.endDate > new Date() ? existingSub.endDate : new Date();
			  const endDate = new Date(baseDate);
			  endDate.setDate(endDate.getDate() + pkg.durationDays);
			  await db.update(userSubscriptions)
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
		const { listings } = await import("../db/schemas/listing-schema");
		await db.update(listings)
			.set({ isFeatured: true, updatedAt: new Date() })
			.where(eq(listings.id, payment.referenceId));
	}

	return c.json(updated);
});

adminApp.post("/notifications/broadcast", zValidator("json", broadcastSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") {
		return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
	}

	const { target, title, body: msgBody } = c.req.valid("json");

	// target can be 'all', 'user', 'dealership', 'workshop', 'mechanic'
	const { user } = await import("../db/schemas/auth-schema");
	
	let usersList;
	if (target !== "all") {
		usersList = await db.select({ id: user.id }).from(user).where(eq(user.accountType, target));
	} else {
		usersList = await db.select({ id: user.id }).from(user);
	}
	if (usersList.length === 0) return c.json({ error: "No users found for target", code: "NO_USERS_FOUND" }, 404);

	const { notifications } = await import("../db/schemas/communication-schema");
	const { sendPushNotification } = await import("../lib/fcm");

	// Batch insert to notifications table
	const notifsToInsert = usersList.map(u => ({
		userId: u.id,
		title,
		body: msgBody,
		type: "system",
	}));

	await db.insert(notifications).values(notifsToInsert);

	// Send pushes asynchronously in the background
	setTimeout(async () => {
		for (const u of usersList) {
			await sendPushNotification(u.id, title, msgBody, { type: "system" });
		}
	}, 0);

	return c.json({ success: true, count: usersList.length }, 201);
});

// --- BANNERS MANAGEMENT ---

adminApp.get("/banners", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const allBanners = await db.select({
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
	}).from(banners);
	return c.json(allBanners);
});

const createBannerSchema = z.object({
	title: z.string().min(1, "title is required"),
	imageUrl: z.string().min(1, "imageUrl is required"),
	targetUrl: z.string().optional().nullable(),
	placement: z.string().default("home_top"),
	startDate: z.string().or(z.date()).optional(),
	endDate: z.string().or(z.date()),
	isActive: z.boolean().default(true),
});

adminApp.post("/banners", zValidator("json", createBannerSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const body = c.req.valid("json");
	const { title, imageUrl, targetUrl, placement, startDate, endDate, isActive } = body;

	const { banners } = await import("../db/schemas/content-schema");
	const [created] = await db.insert(banners).values({
		title,
		imageUrl,
		targetUrl,
		placement: placement || "home_top",
		startDate: startDate ? new Date(startDate) : new Date(),
		endDate: new Date(endDate),
		isActive: isActive ?? true,
		updatedBy: session.user.id,
	}).returning({
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
	});

	return c.json(created, 201);
});

adminApp.put("/banners/:id", zValidator("json", createBannerSchema.partial()), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const body = c.req.valid("json");
	
	const { banners } = await import("../db/schemas/content-schema");
	const [updated] = await db.update(banners)
		.set({
			...body,
			startDate: body.startDate ? new Date(body.startDate) : undefined,
			endDate: body.endDate ? new Date(body.endDate) : undefined,
			updatedBy: session.user.id,
			updatedAt: new Date(),
		})
		.where(eq(banners.id, id))
		.returning({
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
		});

	if (!updated) return c.json({ error: "Banner not found", code: "BANNER_NOT_FOUND" }, 404);
	return c.json(updated);
});

adminApp.delete("/banners/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const [deleted] = await db.delete(banners).where(eq(banners.id, id)).returning();
	
	if (!deleted) return c.json({ error: "Banner not found", code: "BANNER_NOT_FOUND" }, 404);

	// Clean up the associated Cloudinary image asset
	if (deleted.imageUrl) {
		await deleteCloudinaryResources([deleted.imageUrl]).catch((err: any) =>
			console.error(`[Banner] Failed to clean up Cloudinary asset for banner ${id}:`, err)
		);
	}

	return c.json({ success: true });
});

// --- PAGES (CMS) MANAGEMENT ---

const PROTECTED_SLUGS = ["privacy-policy", "terms-and-conditions"] as const;

function sanitizePageContent(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: [
			"h1", "h2", "h3", "h4", "h5", "h6",
			"p", "br", "strong", "em", "b", "i", "u",
			"ul", "ol", "li", "a", "blockquote", "hr",
			"table", "thead", "tbody", "tr", "th", "td",
			"span", "code", "pre"
		],
		allowedAttributes: {
			a: ["href", "target", "rel", "title"],
			"*": ["class", "dir", "lang"],
		},
		allowedSchemes: ["http", "https", "mailto", "tel"],
	});
}

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createPageSchema = z
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

const updatePageSchema = z.object({
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

adminApp.get("/pages", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const allPages = await db
		.select({
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
		})
		.from(pages);
	return c.json(allPages);
});

adminApp.get("/pages/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const [page] = await db
		.select({
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
		})
		.from(pages)
		.where(eq(pages.id, id));

	if (!page) return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);
	return c.json(page);
});

adminApp.post("/pages", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
	}

	const parsed = createPageSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", code: "VALIDATION_FAILED", details: parsed.error.format() }, 400);
	}

	const { slug, title, titleAr, content, contentAr, isActive } = parsed.data;

	const [existing] = await db.select().from(pages).where(eq(pages.slug, slug));
	if (existing) {
		return c.json({ error: "Page with this slug already exists", code: "SLUG_ALREADY_EXISTS" }, 409);
	}

	const sanitizedContent = sanitizePageContent(content);
	const sanitizedContentAr = contentAr ? sanitizePageContent(contentAr) : null;

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

	const [created] = await db
		.insert(pages)
		.values({
			slug,
			title,
			titleAr: titleAr ?? null,
			content: sanitizedContent,
			contentAr: sanitizedContentAr,
			isActive: isActive ?? true,
			updatedBy: session.user.id,
		})
		.returning(pageResponseFields);

	return c.json(created, 201);
});

adminApp.put("/pages/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");

	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
	}

	const parsed = updatePageSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", code: "VALIDATION_FAILED", details: parsed.error.format() }, 400);
	}

	const [target] = await db.select().from(pages).where(eq(pages.id, id));
	if (!target) return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);

	if (parsed.data.slug && parsed.data.slug !== target.slug) {
		const [existing] = await db
			.select()
			.from(pages)
			.where(and(eq(pages.slug, parsed.data.slug), ne(pages.id, id)));
		if (existing) {
			return c.json({ error: "Slug already in use", code: "SLUG_ALREADY_IN_USE" }, 409);
		}
	}

	const finalIsActive = parsed.data.isActive !== undefined ? parsed.data.isActive : target.isActive;
	const finalTitleAr = parsed.data.titleAr !== undefined ? parsed.data.titleAr : target.titleAr;
	const finalContentAr = parsed.data.contentAr !== undefined ? parsed.data.contentAr : target.contentAr;

	if (finalIsActive && (!finalTitleAr || !finalContentAr)) {
		return c.json({ error: "Cannot activate a page with missing Arabic content.", code: "INCOMPLETE_BILINGUAL_CONTENT" }, 400);
	}

	const sanitizedContent =
		parsed.data.content !== undefined ? sanitizePageContent(parsed.data.content) : undefined;
	const sanitizedContentAr =
		parsed.data.contentAr !== undefined
			? parsed.data.contentAr === null
				? null
				: sanitizePageContent(parsed.data.contentAr)
			: undefined;

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

	const [updated] = await db
		.update(pages)
		.set({
			...parsed.data,
			...(sanitizedContent !== undefined ? { content: sanitizedContent } : {}),
			...(sanitizedContentAr !== undefined ? { contentAr: sanitizedContentAr } : {}),
			updatedAt: new Date(),
			updatedBy: session.user.id,
		})
		.where(eq(pages.id, id))
		.returning(pageResponseFields);

	return c.json(updated);
});

adminApp.delete("/pages/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const [target] = await db.select().from(pages).where(eq(pages.id, id));
	if (!target) return c.json({ error: "Page not found", code: "PAGE_NOT_FOUND" }, 404);

	if (PROTECTED_SLUGS.includes(target.slug as (typeof PROTECTED_SLUGS)[number])) {
		return c.json({ error: "This page cannot be deleted. Deactivate it instead.", code: "PAGE_PROTECTED" }, 403);
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

	const [updated] = await db
		.update(pages)
		.set({
			isActive: false,
			updatedAt: new Date(),
			updatedBy: session.user.id,
		})
		.where(eq(pages.id, id))
		.returning(pageResponseFields);

	return c.json({ success: true, page: updated });
});


// --- MODERATION MANAGEMENT ---

const getUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

adminApp.get("/users", zValidator("query", getUsersQuerySchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	const { user } = await import("../db/schemas/auth-schema");
	const allUsers = await db.select({
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
	.limit(limit)
	.offset(offset);
	return c.json(allUsers);
});

const banUserSchema = z.object({
	banned: z.boolean(),
	banReason: z.string().optional().nullable(),
});

adminApp.patch("/users/:id/ban", zValidator("json", banUserSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const { banned, banReason } = c.req.valid("json");

	const { user } = await import("../db/schemas/auth-schema");
	const [updatedUser] = await db.update(user)
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

	if (!updatedUser) return c.json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);

	// Cascade ban to listings
	if (banned) {
		const { listings } = await import("../db/schemas/listing-schema");
		await db.update(listings)
			.set({ status: "banned" })
			.where(eq(listings.userId, id));
	}

	return c.json(updatedUser);
});

const getAdminListingsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.string().optional(),
});

adminApp.get("/listings", zValidator("query", getAdminListingsQuerySchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const { page, limit, status: statusFilter } = c.req.valid("query");
	const offset = (page - 1) * limit;

	const { listings } = await import("../db/schemas/listing-schema");
	
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

	let allListings;
	if (statusFilter) {
		allListings = await db
			.select(listingProjection)
			.from(listings)
			.where(eq(listings.status, statusFilter))
			.limit(limit)
			.offset(offset);
	} else {
		allListings = await db
			.select(listingProjection)
			.from(listings)
			.limit(limit)
			.offset(offset);
	}
	
	return c.json(allListings);
});

const moderateListingSchema = z.object({
	status: z.enum(["available", "pending", "rejected", "banned"]),
});

adminApp.patch("/listings/:id/moderate", zValidator("json", moderateListingSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const id = c.req.param("id");
	const { status } = c.req.valid("json");

	const { listings } = await import("../db/schemas/listing-schema");
	const [updated] = await db.update(listings)
		.set({ status, updatedAt: new Date() })
		.where(eq(listings.id, id))
		.returning({
			id: listings.id,
			userId: listings.userId,
			status: listings.status,
			title: listings.title,
			updatedAt: listings.updatedAt,
		});

	if (!updated) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	return c.json(updated);
});

// --- ANALYTICS & METRICS ---

adminApp.get("/metrics", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session || session.user.role !== "admin") return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	const { user } = await import("../db/schemas/auth-schema");
	const { listings } = await import("../db/schemas/listing-schema");
	const { categories } = await import("../db/schemas/taxonomy-schema");
	const { userSubscriptions, payments } = await import("../db/schemas/monetization-schema");
	const { reports } = await import("../db/schemas/social-schema");
	
	const { sql, eq } = await import("drizzle-orm");

	// Basic approach using raw sql count for safety/speed
	const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(user);
	
	const [{ totalDealerships }] = await db.select({ totalDealerships: sql<number>`count(*)::int` })
		.from(user).where(eq(user.accountType, "dealership"));
		
	const [{ totalWorkshops }] = await db.select({ totalWorkshops: sql<number>`count(*)::int` })
		.from(user).where(eq(user.accountType, "workshop"));
		
	const [{ totalMechanics }] = await db.select({ totalMechanics: sql<number>`count(*)::int` })
		.from(user).where(eq(user.accountType, "mechanic"));

	const [{ totalListings }] = await db.select({ totalListings: sql<number>`count(*)::int` }).from(listings);

	// Vehicles: Exclude spare parts. Let's assume categories with slugs 'spare-parts' or similar. 
	// For MVP, we'll count listings joined with categories where slug is not 'spare-parts'.
	const [{ totalVehicles }] = await db.select({ totalVehicles: sql<number>`count(*)::int` })
		.from(listings)
		.innerJoin(categories, eq(listings.categoryId, categories.id))
		.where(sql`${categories.slug} NOT LIKE '%part%'`);

	const [{ totalSubscriptions }] = await db.select({ totalSubscriptions: sql<number>`count(*)::int` })
		.from(userSubscriptions).where(eq(userSubscriptions.status, "active"));

	const [{ revenue }] = await db.select({ revenue: sql<number>`COALESCE(sum(${payments.amount}), 0)::int` })
		.from(payments).where(eq(payments.status, "completed"));

	const [{ pendingReports }] = await db.select({ pendingReports: sql<number>`count(*)::int` })
		.from(reports).where(eq(reports.status, "pending"));

	const [{ pendingPayments }] = await db.select({ pendingPayments: sql<number>`count(*)::int` })
		.from(payments).where(eq(payments.status, "pending"));

	return c.json({
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
	});
});
