import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { savedSearches } from "../db/schemas/social-schema";
import { auth } from "../../lib/auth";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const savedSearchesApp = new Hono<{ Variables: { user: any } }>();

const createSavedSearchSchema = z.object({
	title: z.string().min(1, "Title is required"),
	filters: z.record(z.string(), z.any()),
});

// GET /api/saved-searches
savedSearchesApp.get("/", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const searches = await db
		.select({
			id: savedSearches.id,
			userId: savedSearches.userId,
			title: savedSearches.title,
			filters: savedSearches.filters,
			lastNotifiedAt: savedSearches.lastNotifiedAt,
			createdAt: savedSearches.createdAt,
			updatedAt: savedSearches.updatedAt,
		})
		.from(savedSearches)
		.where(eq(savedSearches.userId, session.user.id));
	return c.json(searches);
});

// POST /api/saved-searches
savedSearchesApp.post("/", zValidator("json", createSavedSearchSchema), async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const { title, filters } = c.req.valid("json");

	const [created] = await db.insert(savedSearches).values({
		userId: session.user.id,
		title,
		filters,
	}).returning();

	return c.json({
		id: created.id,
		userId: created.userId,
		title: created.title,
		filters: created.filters,
		lastNotifiedAt: created.lastNotifiedAt,
		createdAt: created.createdAt,
		updatedAt: created.updatedAt,
	}, 201);
});

// DELETE /api/saved-searches/:id
savedSearchesApp.delete("/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);

	const id = c.req.param("id");
	const [existing] = await db.select().from(savedSearches).where(eq(savedSearches.id, id));
	
	if (!existing) return c.json({ error: "Not found", code: "SEARCH_NOT_FOUND" }, 404);
	if (existing.userId !== session.user.id) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

	await db.delete(savedSearches).where(eq(savedSearches.id, id));
	return c.json({ success: true });
});
