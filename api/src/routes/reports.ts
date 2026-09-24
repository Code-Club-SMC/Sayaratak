import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, requireRole, type SessionUser } from "../middleware/auth";
import { handleAppError } from "../lib/errors";
import { reportsService } from "../services/reports.service";
import {
	createReportSchema,
	getReportsQuerySchema,
	patchReportSchema,
	idParamSchema,
} from "../schemas";

export const reportsApp = new Hono<{ Variables: { user: SessionUser } }>();

reportsApp.onError(handleAppError);

// POST /api/reports
reportsApp.post("/", requireAuth(), zValidator("json", createReportSchema), async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");
	const report = await reportsService.createReport(user.id, body);
	return c.json(report, 201);
});

// GET /api/reports (Admin only)
reportsApp.get("/", requireRole("admin"), zValidator("query", getReportsQuerySchema), async (c) => {
	const query = c.req.valid("query");
	const results = await reportsService.listReports(query);
	return c.json(results);
});

// PATCH /api/reports/:id (Admin only)
reportsApp.patch(
	"/:id",
	requireRole("admin"),
	zValidator("param", idParamSchema),
	zValidator("json", patchReportSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const body = c.req.valid("json");
		const updated = await reportsService.resolveReport(id, body);
		return c.json(updated);
	},
);
