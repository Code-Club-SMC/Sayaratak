import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { categories, makes, models } from "../db/schemas/taxonomy-schema";
import { requireRole } from "../middleware/auth";

export const taxonomyApp = new Hono();

const getModelsQuerySchema = z.object({
	makeId: z.string().optional(),
	vehicleType: z.string().optional(),
});

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Categories (ordered by displayOrder)
taxonomyApp.get("/categories", async (c) => {
	const list = await db
		.select({
			id: categories.id,
			slug: categories.slug,
			nameEn: categories.nameEn,
			nameAr: categories.nameAr,
			iconUrl: categories.iconUrl,
			displayOrder: categories.displayOrder,
			isActive: categories.isActive,
			createdAt: categories.createdAt,
			updatedAt: categories.updatedAt,
		})
		.from(categories)
		.where(eq(categories.isActive, true))
		.orderBy(asc(categories.displayOrder));

	return c.json(list);
});

// 2. Get Makes / Brands
taxonomyApp.get("/makes", async (c) => {
	const list = await db
		.select({
			id: makes.id,
			slug: makes.slug,
			nameEn: makes.nameEn,
			nameAr: makes.nameAr,
			logoUrl: makes.logoUrl,
			isActive: makes.isActive,
			createdAt: makes.createdAt,
			updatedAt: makes.updatedAt,
		})
		.from(makes)
		.where(eq(makes.isActive, true))
		.orderBy(asc(makes.nameEn));

	return c.json(list);
});

// 3. Get Models for a specific Make
taxonomyApp.get("/makes/:makeId/models", async (c) => {
	const makeId = c.req.param("makeId");

	const list = await db
		.select({
			id: models.id,
			makeId: models.makeId,
			nameEn: models.nameEn,
			nameAr: models.nameAr,
			slug: models.slug,
			vehicleType: models.vehicleType,
			isActive: models.isActive,
			createdAt: models.createdAt,
			updatedAt: models.updatedAt,
		})
		.from(models)
		.where(and(eq(models.makeId, makeId), eq(models.isActive, true)))
		.orderBy(asc(models.nameEn));

	return c.json(list);
});

// 4. Get Models (optional ?makeId=...&vehicleType=...)
taxonomyApp.get("/models", zValidator("query", getModelsQuerySchema), async (c) => {
	const { makeId, vehicleType } = c.req.valid("query");

	const conditions = [eq(models.isActive, true)];
	if (makeId) {
		conditions.push(eq(models.makeId, makeId));
	}
	if (vehicleType) {
		conditions.push(eq(models.vehicleType, vehicleType));
	}

	const list = await db
		.select({
			id: models.id,
			makeId: models.makeId,
			nameEn: models.nameEn,
			nameAr: models.nameAr,
			slug: models.slug,
			vehicleType: models.vehicleType,
			isActive: models.isActive,
			createdAt: models.createdAt,
			updatedAt: models.updatedAt,
		})
		.from(models)
		.where(and(...conditions))
		.orderBy(asc(models.nameEn));

	return c.json(list);
});

const createCategorySchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	iconUrl: z.string().optional(),
	displayOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

const createMakeSchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	logoUrl: z.string().optional(),
	isActive: z.boolean().optional(),
});

const createModelSchema = z.object({
	makeId: z.string().min(1, "makeId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	slug: z.string().min(1, "slug is required"),
	vehicleType: z.string().optional(),
	isActive: z.boolean().optional(),
});

// ==========================================
// ADMIN ENDPOINTS (SCR-082)
// ==========================================

function adminCrud(table: any, entityName: string) {
  const create = async (c: any) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    if (body.slug) body.slug = body.slug.toLowerCase();
    
    // §1: Bilingual completeness policy — Arabic required for publish/activate
    if ((body.isActive ?? true) && !body.nameAr) {
      return c.json({ error: `Arabic name is required to publish a ${entityName.toLowerCase()}`, code: "INCOMPLETE_BILINGUAL_CONTENT" }, 400);
    }

    const [created] = await db
      .insert(table)
      .values({ ...body, isActive: body.isActive ?? true, updatedBy: user?.id })
      .returning();
    return c.json(created, 201);
  };

  const update = async (c: any) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    if (body.slug) body.slug = body.slug.toLowerCase();

    // §1: Bilingual completeness policy — Arabic required for publish/activate
    if (body.isActive === true) {
      const [existing] = await db.select().from(table).where(eq(table.id, id));
      if (!existing) return c.json({ error: `${entityName} not found`, code: `${entityName.toUpperCase()}_NOT_FOUND` }, 404);
      const effectiveNameAr = body.nameAr !== undefined ? body.nameAr : existing.nameAr;
      if (!effectiveNameAr) {
        return c.json({ error: `Cannot activate a ${entityName.toLowerCase()} without Arabic name`, code: "INCOMPLETE_BILINGUAL_CONTENT" }, 400);
      }
    }

    const [updated] = await db
      .update(table)
      .set({ ...body, updatedBy: user?.id, updatedAt: new Date() })
      .where(eq(table.id, id))
      .returning();
    if (!updated) return c.json({ error: `${entityName} not found`, code: `${entityName.toUpperCase()}_NOT_FOUND` }, 404);
    return c.json(updated);
  };

  const remove = async (c: any) => {
    const id = c.req.param("id");
    const [deleted] = await db.delete(table).where(eq(table.id, id)).returning();
    if (!deleted) return c.json({ error: `${entityName} not found`, code: `${entityName.toUpperCase()}_NOT_FOUND` }, 404);
    return c.json({ success: true, message: `${entityName} deleted successfully` });
  };

  return { create, update, remove };
}

const categoryCrud = adminCrud(categories, "Category");
taxonomyApp.post("/admin/categories", requireRole("admin"), zValidator("json", createCategorySchema), categoryCrud.create);
taxonomyApp.patch("/admin/categories/:id", requireRole("admin"), zValidator("json", createCategorySchema.partial()), categoryCrud.update);
taxonomyApp.delete("/admin/categories/:id", requireRole("admin"), categoryCrud.remove);

const makesCrud = adminCrud(makes, "Make");
taxonomyApp.post("/admin/makes", requireRole("admin"), zValidator("json", createMakeSchema), makesCrud.create);
taxonomyApp.patch("/admin/makes/:id", requireRole("admin"), zValidator("json", createMakeSchema.partial()), makesCrud.update);
taxonomyApp.delete("/admin/makes/:id", requireRole("admin"), makesCrud.remove);

const modelsCrud = adminCrud(models, "Model");
taxonomyApp.post("/admin/models", requireRole("admin"), zValidator("json", createModelSchema), modelsCrud.create);
taxonomyApp.patch("/admin/models/:id", requireRole("admin"), zValidator("json", createModelSchema.partial()), modelsCrud.update);
taxonomyApp.delete("/admin/models/:id", requireRole("admin"), modelsCrud.remove);
