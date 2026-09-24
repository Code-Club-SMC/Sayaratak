import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAdmin, type SessionUser } from "../middleware/auth";
import { handleAppError, UnauthorizedError } from "../lib/errors";
import { adminService } from "../services/admin.service";
import {
	createAdminSchema,
	verifyProfileSchema,
	approvePaymentSchema,
	broadcastSchema,
	createBannerSchema,
	updateBannerSchema,
	createPageSchema,
	updatePageSchema,
	getUsersQuerySchema,
	banUserSchema,
	getAdminListingsQuerySchema,
	moderateListingSchema,
	idParamSchema,
} from "../schemas";

export const adminApp = new Hono<{ Variables: { user: SessionUser } }>();

adminApp.onError(handleAppError);

adminApp.use("/*", async (c, next) => {
	if (c.req.path.endsWith("/create")) {
		return next();
	}
	return requireAdmin()(c, next);
});

// POST /create (Secret key based admin bootstrap)
adminApp.post("/create", zValidator("json", createAdminSchema), async (c) => {
	const secretKey = c.req.header("x-secret-key");
	if (!secretKey || secretKey !== process.env.ADMIN_CREATE_SECRET) {
		throw new UnauthorizedError("Unauthorized", "UNAUTHORIZED");
	}

	const user = await adminService.createAdmin(c.req.valid("json"));
	return c.json(user, 201);
});

// PATCH /profiles/:type/:id/verify
adminApp.patch(
	"/profiles/:type/:id/verify",
	zValidator("param", idParamSchema),
	zValidator("json", verifyProfileSchema),
	async (c) => {
		const type = c.req.param("type");
		const { id } = c.req.valid("param");
		const { isVerified } = c.req.valid("json");
		const updated = await adminService.verifyProfile(type, id, isVerified);
		return c.json(updated);
	},
);

// PATCH /payments/:id/approve
adminApp.patch(
	"/payments/:id/approve",
	zValidator("param", idParamSchema),
	zValidator("json", approvePaymentSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const { status } = c.req.valid("json");
		const updated = await adminService.approvePayment(id, status);
		return c.json(updated);
	},
);

// POST /notifications/broadcast
adminApp.post("/notifications/broadcast", zValidator("json", broadcastSchema), async (c) => {
	const { target, title, body: msgBody } = c.req.valid("json");
	const result = await adminService.broadcastNotification(target, title, msgBody);
	return c.json(result, 201);
});

// --- BANNERS MANAGEMENT ---

adminApp.get("/banners", async (c) => {
	const banners = await adminService.listBanners();
	return c.json(banners);
});

adminApp.post("/banners", zValidator("json", createBannerSchema), async (c) => {
	const currentUser = c.get("user");
	const created = await adminService.createBanner(c.req.valid("json"), currentUser?.id);
	return c.json(created, 201);
});

adminApp.put(
	"/banners/:id",
	zValidator("param", idParamSchema),
	zValidator("json", updateBannerSchema),
	async (c) => {
		const currentUser = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await adminService.updateBanner(id, c.req.valid("json"), currentUser?.id);
		return c.json(updated);
	},
);

adminApp.delete("/banners/:id", zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const result = await adminService.deleteBanner(id);
	return c.json(result);
});

// --- PAGES (CMS) MANAGEMENT ---

adminApp.get("/pages", async (c) => {
	const pages = await adminService.listPages();
	return c.json(pages);
});

adminApp.get("/pages/:id", zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const page = await adminService.getPageById(id);
	return c.json(page);
});

adminApp.post("/pages", zValidator("json", createPageSchema), async (c) => {
	const currentUser = c.get("user");
	const created = await adminService.createPage(c.req.valid("json"), currentUser?.id);
	return c.json(created, 201);
});

adminApp.put(
	"/pages/:id",
	zValidator("param", idParamSchema),
	zValidator("json", updatePageSchema),
	async (c) => {
		const currentUser = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await adminService.updatePage(id, c.req.valid("json"), currentUser?.id);
		return c.json(updated);
	},
);

adminApp.delete("/pages/:id", zValidator("param", idParamSchema), async (c) => {
	const currentUser = c.get("user");
	const { id } = c.req.valid("param");
	const result = await adminService.deletePage(id, currentUser?.id);
	return c.json(result);
});

// --- MODERATION MANAGEMENT ---

adminApp.get("/users", zValidator("query", getUsersQuerySchema), async (c) => {
	const users = await adminService.listUsers(c.req.valid("query"));
	return c.json(users);
});

adminApp.patch(
	"/users/:id/ban",
	zValidator("param", idParamSchema),
	zValidator("json", banUserSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const { banned, banReason } = c.req.valid("json");
		const updated = await adminService.banUser(id, banned, banReason);
		return c.json(updated);
	},
);

adminApp.get("/listings", zValidator("query", getAdminListingsQuerySchema), async (c) => {
	const listings = await adminService.listListings(c.req.valid("query"));
	return c.json(listings);
});

adminApp.patch(
	"/listings/:id/moderate",
	zValidator("param", idParamSchema),
	zValidator("json", moderateListingSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const { status } = c.req.valid("json");
		const updated = await adminService.moderateListing(id, status);
		return c.json(updated);
	},
);

// --- ANALYTICS & METRICS ---

adminApp.get("/metrics", async (c) => {
	const metrics = await adminService.getMetrics();
	return c.json(metrics);
});
