import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireRole, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { locationsService } from "../services/locations.service";
import {
	getCitiesQuerySchema,
	getDistrictsQuerySchema,
	createCountrySchema,
	updateCountrySchema,
	createCitySchema,
	updateCitySchema,
	createDistrictSchema,
	updateDistrictSchema,
	idParamSchema,
} from "../schemas";

export const locationsApp = new Hono<{ Variables: { user: SessionUser } }>();

locationsApp.onError(handleAppError);

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Countries
locationsApp.get("/countries", async (c) => {
	const list = await locationsService.getCountries();
	return c.json(list);
});

// 2. Get Cities (optional ?countryId=...)
locationsApp.get("/cities", zValidator("query", getCitiesQuerySchema), async (c) => {
	const { countryId } = c.req.valid("query");
	const list = await locationsService.getCities(countryId);
	return c.json(list);
});

// 3. Get Districts (optional ?cityId=...)
locationsApp.get("/districts", zValidator("query", getDistrictsQuerySchema), async (c) => {
	const { cityId } = c.req.valid("query");
	const list = await locationsService.getDistricts(cityId);
	return c.json(list);
});

// ==========================================
// ADMIN ENDPOINTS (SCR-083)
// ==========================================

// --- Countries Admin ---
locationsApp.post("/admin/countries", requireRole("admin"), zValidator("json", createCountrySchema), async (c) => {
	const user = c.get("user");
	const created = await locationsService.createCountry(c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

locationsApp.patch(
	"/admin/countries/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateCountrySchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await locationsService.updateCountry(id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

locationsApp.delete("/admin/countries/:id", requireRole("admin"), zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const result = await locationsService.deleteCountry(id);
	return c.json(result);
});

// --- Cities Admin ---
locationsApp.post("/admin/cities", requireRole("admin"), zValidator("json", createCitySchema), async (c) => {
	const user = c.get("user");
	const created = await locationsService.createCity(c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

locationsApp.patch(
	"/admin/cities/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateCitySchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await locationsService.updateCity(id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

locationsApp.delete("/admin/cities/:id", requireRole("admin"), zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const result = await locationsService.deleteCity(id);
	return c.json(result);
});

// --- Districts Admin ---
locationsApp.post("/admin/districts", requireRole("admin"), zValidator("json", createDistrictSchema), async (c) => {
	const user = c.get("user");
	const created = await locationsService.createDistrict(c.req.valid("json"), user?.id);
	return c.json(created, 201);
});

locationsApp.patch(
	"/admin/districts/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", updateDistrictSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const updated = await locationsService.updateDistrict(id, c.req.valid("json"), user?.id);
		return c.json(updated);
	},
);

locationsApp.delete("/admin/districts/:id", requireRole("admin"), zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const result = await locationsService.deleteDistrict(id);
	return c.json(result);
});
