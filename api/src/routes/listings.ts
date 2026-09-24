import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { listingsService } from "../services/listings.service";
import {
	createListingSchema,
	updateListingSchema,
	patchStatusSchema,
	clickSchema,
	getListingsQuerySchema,
	getMyListingsQuerySchema,
	getMapListingsQuerySchema,
	idParamSchema,
} from "../schemas";

export const listingsApp = new Hono<{ Variables: { user: SessionUser } }>();

listingsApp.onError(handleAppError);

// GET /api/listings
listingsApp.get("/", zValidator("query", getListingsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	const result = await listingsService.findListings(query);
	return c.json(result);
});

// GET /api/listings/map
listingsApp.get(
	"/map",
	zValidator("query", getMapListingsQuerySchema),
	async (c) => {
		const query = c.req.valid("query");
		const results = await listingsService.findMapListings(query);
		return c.json(results);
	},
);

// GET /api/listings/me (authenticated owner listing management)
listingsApp.get(
	"/me",
	requireAuth(),
	zValidator("query", getMyListingsQuerySchema),
	async (c) => {
		const user = c.get("user");
		const query = c.req.valid("query");
		const results = await listingsService.findMyListings(user, query);
		return c.json(results);
	},
);

// GET /api/listings/manage/:id (authenticated owner/admin detail for any lifecycle status)
listingsApp.get(
	"/manage/:id",
	requireAuth(),
	zValidator("param", idParamSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const listing = await listingsService.getManagedListingById(id, user);
		return c.json(listing);
	},
);

// GET /api/listings/:id
listingsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const listing = await listingsService.getListingById(id);
	return c.json(listing);
});

// POST /api/listings (requires auth)
listingsApp.post(
	"/",
	requireAuth(),
	zValidator("json", createListingSchema),
	async (c) => {
		const user = c.get("user");
		const body = c.req.valid("json");
		const created = await listingsService.createListing(user.id, body);
		return c.json(created, 201);
	},
);

// PUT /api/listings/:id (requires auth and ownership)
listingsApp.put(
	"/:id",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", updateListingSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const body = c.req.valid("json");
		const updated = await listingsService.updateListing(id, user, body);
		return c.json(updated);
	},
);

// DELETE /api/listings/:id
listingsApp.delete(
	"/:id",
	requireAuth(),
	zValidator("param", idParamSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const result = await listingsService.deleteListing(id, user);
		return c.json(result);
	},
);

// PATCH /api/listings/:id/status (requires auth and ownership)
listingsApp.patch(
	"/:id/status",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", patchStatusSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const { status } = c.req.valid("json");
		const updated = await listingsService.updateListingStatus(id, user, status);
		return c.json(updated);
	},
);

// POST /api/listings/:id/clicks
// Public endpoint for analytics (increment view, phone, or whatsapp count)
listingsApp.post(
	"/:id/clicks",
	zValidator("param", idParamSchema),
	zValidator("json", clickSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const { type } = c.req.valid("json");
		const userAgent = c.req.header("user-agent");
		const result = await listingsService.trackListingClick(id, type, userAgent);
		return c.json(result);
	},
);
