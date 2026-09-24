import { Hono } from "hono";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { handleAppError } from "../lib/errors";
import { savedSearchesService } from "../services/saved-searches.service";
import {
	createSavedSearchSchema,
	idParamSchema,
} from "../schemas";

export const savedSearchesApp = new Hono<{ Variables: { user: SessionUser } }>();

savedSearchesApp.onError(handleAppError);
savedSearchesApp.use("/*", requireAuth());

// GET /api/saved-searches
savedSearchesApp.get("/", async (c) => {
	const user = c.get("user");
	const searches = await savedSearchesService.listSavedSearches(user.id);
	return c.json(searches);
});

// POST /api/saved-searches
savedSearchesApp.post("/", zValidator("json", createSavedSearchSchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const created = await savedSearchesService.createSavedSearch(user.id, body);
	return c.json(created, 201);
});

// DELETE /api/saved-searches/:id
savedSearchesApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
	const user = c.get("user");
	const { id } = c.req.valid("param");
	const result = await savedSearchesService.deleteSavedSearch(id, user.id);
	return c.json(result);
});
