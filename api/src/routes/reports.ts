import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { reports } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { auth } from "../../lib/auth";
import { requireRole } from "../middleware/auth";
import { user } from "../db/schemas/auth-schema";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const createReportSchema = z.object({
	listingId: z.string().optional(),
	reason: z.string().min(1),
	description: z.string().optional()
});

export const reportsApp = new Hono();

// POST /api/reports
reportsApp.post("/", zValidator("json", createReportSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { listingId, reason, description } = c.req.valid("json");

	if (listingId) {
		const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
		if (!listing) return c.json({ error: "Listing not found", code: "LISTING_NOT_FOUND" }, 404);
	}

	const [report] = await db
		.insert(reports)
		.values({
			reporterId: session.user.id,
			listingId,
			reason,
			description,
		})
		.returning();

	return c.json({
		id: report.id,
		reporterId: report.reporterId,
		listingId: report.listingId,
		reason: report.reason,
		description: report.description,
		status: report.status,
		createdAt: report.createdAt,
		updatedAt: report.updatedAt,
	}, 201);
});

const getReportsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(["pending", "resolved", "dismissed"]).optional(),
});

// GET /api/reports (Admin only)
reportsApp.get("/", requireRole("admin"), zValidator("query", getReportsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	const limit = query.limit;
	
	let baseQuery = db
		.select({
			report: {
				id: reports.id,
				reporterId: reports.reporterId,
				listingId: reports.listingId,
				reason: reports.reason,
				description: reports.description,
				status: reports.status,
				createdAt: reports.createdAt,
				updatedAt: reports.updatedAt,
			},
			reporter: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
			listing: {
				id: listings.id,
				title: listings.title,
				price: listings.price,
				currency: listings.currency,
				status: listings.status,
				userId: listings.userId,
			},
		})
		.from(reports)
		.innerJoin(user, eq(reports.reporterId, user.id))
		.leftJoin(listings, eq(reports.listingId, listings.id))
		.$dynamic();

	if (query.status) {
		baseQuery = baseQuery.where(eq(reports.status, query.status));
	}

	const results = await baseQuery.orderBy(sql`${reports.createdAt} DESC`).limit(limit);

	return c.json(results);
});

const patchReportSchema = z.object({
	status: z.enum(["pending", "reviewed", "resolved", "dismissed"])
});

// PATCH /api/reports/:id (Admin only)
reportsApp.patch("/:id", requireRole("admin"), zValidator("json", patchReportSchema), async (c) => {
	const id = c.req.param("id");
	const { status } = c.req.valid("json");

	const [updated] = await db
		.update(reports)
		.set({ status, updatedAt: new Date() })
		.where(eq(reports.id, id))
		.returning();

	if (!updated) return c.json({ error: "Report not found", code: "REPORT_NOT_FOUND" }, 404);

	return c.json({
		id: updated.id,
		reporterId: updated.reporterId,
		listingId: updated.listingId,
		reason: updated.reason,
		description: updated.description,
		status: updated.status,
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	});
});
