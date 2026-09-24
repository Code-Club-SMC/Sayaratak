import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { favoritesService } from "../services/favorites.service";
import {
	getFavoritesQuerySchema,
	listingIdParamSchema,
} from "../schemas";

export const favoritesApp = new Hono<{ Variables: { user: SessionUser } }>();

favoritesApp.onError(handleAppError);
favoritesApp.use("/*", requireAuth());

// GET /api/favorites
favoritesApp.get("/", zValidator("query", getFavoritesQuerySchema), async (c) => {
	const user = c.get("user");
	const query = c.req.valid("query");
	const results = await favoritesService.listFavorites(user.id, query);
	return c.json(results);
});

// POST /api/favorites/:listingId
favoritesApp.post("/:listingId", zValidator("param", listingIdParamSchema), async (c) => {
	const user = c.get("user");
	const { listingId } = c.req.valid("param");
	const created = await favoritesService.addFavorite(user.id, listingId);
	return c.json(created, 201);
});

// DELETE /api/favorites/:listingId
favoritesApp.delete("/:listingId", zValidator("param", listingIdParamSchema), async (c) => {
	const user = c.get("user");
	const { listingId } = c.req.valid("param");
	const result = await favoritesService.removeFavorite(user.id, listingId);
	return c.json(result);
});
