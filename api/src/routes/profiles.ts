import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import {
	mapProfileQuerySchema,
	patchProfileSchema,
	idParamSchema,
} from "../schemas";
import { handleAppError } from "../lib/errors";
import { profilesService } from "../services/profiles.service";

export const profilesApp = new Hono<{ Variables: { user: SessionUser } }>();

profilesApp.onError(handleAppError);

// GET /api/profiles/:type/map (Clustering for map)
profilesApp.get("/:type/map", zValidator("query", mapProfileQuerySchema), async (c) => {
	const type = c.req.param("type");
	const query = c.req.valid("query");
	const results = await profilesService.getProfilesMap(type, query);
	return c.json(results);
});

// GET /api/profiles/:type/:id (Public view)
profilesApp.get("/:type/:id", zValidator("param", idParamSchema), async (c) => {
	const type = c.req.param("type");
	const { id } = c.req.valid("param");
	const profile = await profilesService.getProfileById(type, id);
	return c.json(profile);
});

// PATCH /api/profiles/:type (Update own profile)
profilesApp.patch("/:type", requireAuth(), zValidator("json", patchProfileSchema), async (c) => {
	const user = c.get("user");
	const type = c.req.param("type");
	const body = c.req.valid("json");
	const updated = await profilesService.updateProfile(user, type, body);
	return c.json(updated);
});
