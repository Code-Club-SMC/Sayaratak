import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { categories, makes, models } from "../db/schemas/taxonomy-schema";
import { requireRole, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { taxonomyService } from "../services/taxonomy.service";
import {
	getModelsQuerySchema,
	createCategorySchema,
	updateCategorySchema,
	createMakeSchema,
	updateMakeSchema,
	createModelSchema,
	updateModelSchema,
	makeIdParamSchema,
	idParamSchema,
} from "../schemas";

export const taxonomyApp = new Hono<{ Variables: { user: SessionUser } }>();

taxonomyApp.onError(handleAppError);

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Categories (ordered by displayOrder)
taxonomyApp.get("/categories", async (c) => {
	const list = await taxonomyService.getCategories();
	return c.json(list);
});

// 2. Get Makes / Brands
taxonomyApp.get("/makes", async (c) => {
	const list = await taxonomyService.getMakes();
	return c.json(list);
});

// 3. Get Models for a specific Make
taxonomyApp.get("/makes/:makeId/models", zValidator("param", makeIdParamSchema), async (c) => {
	const { makeId } = c.req.valid("param");
	const list = await taxonomyService.getModelsByMake(makeId);
	return c.json(list);
});

// 4. Get Models (optional ?makeId=...&vehicleType=...)
taxonomyApp.get("/models", zValidator("query", getModelsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	const list = await taxonomyService.getModels(query);
	return c.json(list);
});

// ==========================================
// ADMIN ENDPOINTS (SCR-082)
// ==========================================

// --- Categories Admin ---
taxonomyApp.post("/admin/categories", requireRole("admin"), zValidator("json", createCategorySchema), async (c) => {
	const user = c.get("user");
	const created = await taxonomyService.createEntity(categories, "Category", c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

taxonomyApp.patch(
	"/admin/categories/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateCategorySchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await taxonomyService.updateEntity(categories, "Category", id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

taxonomyApp.delete(
	"/admin/categories/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const result = await taxonomyService.deleteEntity(categories, "Category", id);
		return c.json(result);
	},
);

// --- Makes Admin ---
taxonomyApp.post("/admin/makes", requireRole("admin"), zValidator("json", createMakeSchema), async (c) => {
	const user = c.get("user");
	const created = await taxonomyService.createEntity(makes, "Make", c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

taxonomyApp.patch(
	"/admin/makes/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateMakeSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await taxonomyService.updateEntity(makes, "Make", id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

taxonomyApp.delete(
	"/admin/makes/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const result = await taxonomyService.deleteEntity(makes, "Make", id);
		return c.json(result);
	},
);

// --- Models Admin ---
taxonomyApp.post("/admin/models", requireRole("admin"), zValidator("json", createModelSchema), async (c) => {
	const user = c.get("user");
	const created = await taxonomyService.createEntity(models, "Model", c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

taxonomyApp.patch(
	"/admin/models/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateModelSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await taxonomyService.updateEntity(models, "Model", id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

taxonomyApp.delete(
	"/admin/models/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const result = await taxonomyService.deleteEntity(models, "Model", id);
		return c.json(result);
	},
);
