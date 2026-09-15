import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { countries, cities, districts } from "../db/schemas/taxonomy-schema";
import { requireRole } from "../middleware/auth";

export const locationsApp = new Hono();

const getCitiesQuerySchema = z.object({
	countryId: z.string().optional(),
});

const getDistrictsQuerySchema = z.object({
	cityId: z.string().optional(),
});

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Countries
locationsApp.get("/countries", async (c) => {
	const list = await db
		.select({
			id: countries.id,
			nameEn: countries.nameEn,
			nameAr: countries.nameAr,
			code: countries.code,
			currencyCode: countries.currencyCode,
			phoneCode: countries.phoneCode,
			isActive: countries.isActive,
			createdAt: countries.createdAt,
			updatedAt: countries.updatedAt,
		})
		.from(countries)
		.where(eq(countries.isActive, true))
		.orderBy(asc(countries.nameEn));

	return c.json(list);
});

// 2. Get Cities (optional ?countryId=...)
locationsApp.get("/cities", zValidator("query", getCitiesQuerySchema), async (c) => {
	const { countryId } = c.req.valid("query");

	const conditions = [eq(cities.isActive, true)];
	if (countryId) {
		conditions.push(eq(cities.countryId, countryId));
	}

	const list = await db
		.select({
			id: cities.id,
			countryId: cities.countryId,
			nameEn: cities.nameEn,
			nameAr: cities.nameAr,
			lat: cities.lat,
			lng: cities.lng,
			isActive: cities.isActive,
			createdAt: cities.createdAt,
			updatedAt: cities.updatedAt,
		})
		.from(cities)
		.where(and(...conditions))
		.orderBy(asc(cities.nameEn));

	return c.json(list);
});

// 3. Get Districts (optional ?cityId=...)
locationsApp.get("/districts", zValidator("query", getDistrictsQuerySchema), async (c) => {
	const { cityId } = c.req.valid("query");

	const conditions = [eq(districts.isActive, true)];
	if (cityId) {
		conditions.push(eq(districts.cityId, cityId));
	}

	const list = await db
		.select({
			id: districts.id,
			cityId: districts.cityId,
			nameEn: districts.nameEn,
			nameAr: districts.nameAr,
			lat: districts.lat,
			lng: districts.lng,
			isActive: districts.isActive,
			createdAt: districts.createdAt,
			updatedAt: districts.updatedAt,
		})
		.from(districts)
		.where(and(...conditions))
		.orderBy(asc(districts.nameEn));

	return c.json(list);
});

const createCountrySchema = z.object({
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	code: z.string().min(2, "code is required"),
	currencyCode: z.string().optional(),
	phoneCode: z.string().optional(),
	isActive: z.boolean().optional(),
});

const createCitySchema = z.object({
	countryId: z.string().min(1, "countryId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	isActive: z.boolean().optional(),
});

const createDistrictSchema = z.object({
	cityId: z.string().min(1, "cityId is required"),
	nameEn: z.string().min(1, "nameEn is required"),
	nameAr: z.string().min(1, "nameAr is required"),
	lat: z.number().optional().nullable(),
	lng: z.number().optional().nullable(),
	isActive: z.boolean().optional(),
});

// ==========================================
// ADMIN ENDPOINTS (SCR-083)
// ==========================================

// --- Countries Admin ---
locationsApp.post("/admin/countries", requireRole("admin"), zValidator("json", createCountrySchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const { nameEn, nameAr, code, currencyCode, phoneCode, isActive } = body;

	const [created] = await db
		.insert(countries)
		.values({
			nameEn,
			nameAr,
			code: code.toUpperCase(),
			currencyCode: currencyCode || "SDG",
			phoneCode: phoneCode || "+249",
			isActive: isActive ?? true,
			updatedBy: user?.id,
		})
		.returning();

	return c.json(created, 201);
});

locationsApp.patch("/admin/countries/:id", requireRole("admin"), zValidator("json", createCountrySchema.partial()), async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = c.req.valid("json");

	const [updated] = await db
		.update(countries)
		.set({
			...body,
			code: body.code ? body.code.toUpperCase() : undefined,
			updatedBy: user?.id,
			updatedAt: new Date(),
		})
		.where(eq(countries.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "Country not found", code: "COUNTRY_NOT_FOUND" }, 404);
	}

	return c.json(updated);
});

locationsApp.delete("/admin/countries/:id", requireRole("admin"), async (c) => {
	const id = c.req.param("id");
	const [deleted] = await db
		.delete(countries)
		.where(eq(countries.id, id))
		.returning();

	if (!deleted) {
		return c.json({ error: "Country not found", code: "COUNTRY_NOT_FOUND" }, 404);
	}

	return c.json({ success: true, message: "Country deleted successfully" });
});

// --- Cities Admin ---
locationsApp.post("/admin/cities", requireRole("admin"), zValidator("json", createCitySchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const { countryId, nameEn, nameAr, lat, lng, isActive } = body;

	const [created] = await db
		.insert(cities)
		.values({
			countryId,
			nameEn,
			nameAr,
			lat: lat ? Number(lat) : null,
			lng: lng ? Number(lng) : null,
			isActive: isActive ?? true,
			updatedBy: user?.id,
		})
		.returning();

	return c.json(created, 201);
});

locationsApp.patch("/admin/cities/:id", requireRole("admin"), zValidator("json", createCitySchema.partial()), async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = c.req.valid("json");

	const [updated] = await db
		.update(cities)
		.set({
			...body,
			updatedBy: user?.id,
			updatedAt: new Date(),
		})
		.where(eq(cities.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "City not found", code: "CITY_NOT_FOUND" }, 404);
	}

	return c.json(updated);
});

locationsApp.delete("/admin/cities/:id", requireRole("admin"), async (c) => {
	const id = c.req.param("id");
	const [deleted] = await db
		.delete(cities)
		.where(eq(cities.id, id))
		.returning();

	if (!deleted) {
		return c.json({ error: "City not found", code: "CITY_NOT_FOUND" }, 404);
	}

	return c.json({ success: true, message: "City deleted successfully" });
});

// --- Districts Admin ---
locationsApp.post("/admin/districts", requireRole("admin"), zValidator("json", createDistrictSchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const { cityId, nameEn, nameAr, lat, lng, isActive } = body;

	const [created] = await db
		.insert(districts)
		.values({
			cityId,
			nameEn,
			nameAr,
			lat: lat ? Number(lat) : null,
			lng: lng ? Number(lng) : null,
			isActive: isActive ?? true,
			updatedBy: user?.id,
		})
		.returning();

	return c.json(created, 201);
});

locationsApp.patch("/admin/districts/:id", requireRole("admin"), zValidator("json", createDistrictSchema.partial()), async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = c.req.valid("json");

	const [updated] = await db
		.update(districts)
		.set({
			...body,
			updatedBy: user?.id,
			updatedAt: new Date(),
		})
		.where(eq(districts.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "District not found", code: "DISTRICT_NOT_FOUND" }, 404);
	}

	return c.json(updated);
});

locationsApp.delete("/admin/districts/:id", requireRole("admin"), async (c) => {
	const id = c.req.param("id");
	const [deleted] = await db
		.delete(districts)
		.where(eq(districts.id, id))
		.returning();

	if (!deleted) {
		return c.json({ error: "District not found", code: "DISTRICT_NOT_FOUND" }, 404);
	}

	return c.json({ success: true, message: "District deleted successfully" });
});
