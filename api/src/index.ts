import { Hono } from "hono";

import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import { adminApp } from "./routes/admin";
import { locationsApp } from "./routes/locations";
import { taxonomyApp } from "./routes/taxonomy";
import { listingsApp } from "./routes/listings";
import { mediaApp } from "./routes/media";
import { favoritesApp } from "./routes/favorites";
import { reviewsApp } from "./routes/reviews";
import { reportsApp } from "./routes/reports";
import { profilesApp } from "./routes/profiles";
import { savedSearchesApp } from "./routes/saved-searches";
import { paymentsApp } from "./routes/payments";
import { notificationsApp } from "./routes/notifications";
import { chatApp } from "./routes/chat";
import { contentApp } from "./routes/content";
import { seoApp } from "./routes/seo";
import { shareApp } from "./routes/share";
import { startMatchJob } from "./cron/match-job";
import { startMediaCleanupJob } from "./cron/media-cleanup-job";

import { logger } from "hono/logger";
import { i18nMiddleware } from "./middleware/i18n";
import { t } from "./lib/i18n";

// Start background workers
startMatchJob();
startMediaCleanupJob();

import { upgradeWebSocket, websocket } from "./lib/ws";
export { upgradeWebSocket, websocket };

const app = new Hono().basePath("/api");

// 1. Logger Middleware
app.use("/*", logger());

// 2. CORS Hardening
const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:8000",
	"https://sayaratak.com",
	process.env.CLIENT_URL,
	process.env.BETTER_AUTH_URL,
].filter(Boolean) as string[];

const corsMiddleware = cors({
	origin: (origin) => {
		if (!origin) return allowedOrigins[0] || "*";
		if (allowedOrigins.includes(origin) || origin.endsWith(".railway.app") || origin.endsWith(".render.com")) {
			return origin;
		}
		return allowedOrigins[0];
	},
	credentials: true,
});
app.use("/*", corsMiddleware);

// 3. i18n Language & Error Localization Middleware
app.use("/*", i18nMiddleware);

// 3. Global Error Handling
app.onError((err, c) => {
	console.error(`[Error] ${err.message}`, err.stack);
	const locale = c.get('locale') || 'en';
	return c.json({ error: t("INTERNAL_ERROR", locale), code: "INTERNAL_ERROR" }, 500);
});

// 4. Rate Limiting Middleware
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const rateLimiter = async (c: any, next: any) => {
	const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
	const now = Date.now();
	const windowMs = 60 * 1000; // 1 minute
	const limit = 100;

	let record = rateLimitMap.get(ip);
	if (!record || record.resetAt < now) {
		record = { count: 0, resetAt: now + windowMs };
	}
	record.count++;
	rateLimitMap.set(ip, record);

	if (record.count > limit) {
		return c.json({ error: "Too Many Requests", code: "RATE_LIMIT_EXCEEDED" }, 429);
	}
	await next();
};

app.use("/v1/*", rateLimiter);
app.all("/auth/*", (c) => auth.handler(c.req.raw));

// 5. API Versioning (v1)
const v1 = new Hono();

v1.route("/admin", adminApp);
v1.route("/locations", locationsApp);
v1.route("/taxonomy", taxonomyApp);
v1.route("/listings", listingsApp);
v1.route("/media", mediaApp);
v1.route("/favorites", favoritesApp);
v1.route("/reviews", reviewsApp);
v1.route("/reports", reportsApp);
v1.route("/profiles", profilesApp);
v1.route("/saved-searches", savedSearchesApp);
v1.route("/payments", paymentsApp);
v1.route("/notifications", notificationsApp);
v1.route("/chat", chatApp);
v1.route("/content", contentApp);
v1.route("/seo", seoApp);
v1.route("/share", shareApp);
v1.route("/", taxonomyApp); // allows /api/v1/categories, /api/v1/makes, /api/v1/models directly

app.route("/v1", v1);
app.route("/s", shareApp); // support /api/s/:code directly

import { swaggerUI } from "@hono/swagger-ui";
import { openApiSpec } from "./openapi";

// OpenAPI specification & Swagger UI documentation
app.get("/openapi.json", (c) => c.json(openApiSpec));
app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));

app.get("/", (c) => {
	return c.text("Sayaratak API");
});

import { queryClient } from "./db";

const gracefulShutdown = async () => {
	console.log("Shutdown signal received. Closing PostgreSQL connection...");
	await queryClient.end();
	console.log("Graceful shutdown complete.");
	process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export default {
	hostname: "0.0.0.0",
	port: process.env.PORT ? Number(process.env.PORT) : 8000,
	fetch: app.fetch,
	websocket,
};
