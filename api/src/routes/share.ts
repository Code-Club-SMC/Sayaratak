import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { optionalAuth, type SessionUser } from "../middleware/auth";
import { resolveLocale } from "../lib/i18n";
import { generateShareSchema, codeParamSchema } from "../schemas";
import { handleAppError, RateLimitError } from "../lib/errors";
import { createUserRateLimiter } from "../lib/rate-limiter";
import { isBotUserAgent } from "../lib/bot-detection";
import { shareService, generateShortCode } from "../services/share.service";

export { isBotUserAgent, generateShortCode };

export const shareApp = new Hono<{ Variables: { user?: SessionUser } }>();

shareApp.onError(handleAppError);
shareApp.use("/*", optionalAuth());

// §6: Per-user rate limiting for share link generation (30 reqs/min)
const shareRateLimiter = createUserRateLimiter(30);

// =============================================================
// 1. POST /api/v1/share/generate (Create/Fetch Short Link & Intents)
// =============================================================
shareApp.post("/generate", zValidator("json", generateShareSchema), async (c) => {
	const user = c.get("user");
	const userId = user?.id || null;

	const rateKey = userId || c.req.header("x-forwarded-for") || "anonymous";
	if (!shareRateLimiter.check(rateKey)) {
		throw new RateLimitError(
			"Too Many Requests. Share generation limit exceeded.",
			"RATE_LIMIT_EXCEEDED",
		);
	}

	const body = c.req.valid("json");
	const locale = c.get("locale") || body.locale || resolveLocale(c.req);

	const result = await shareService.generateShareLink(body, userId, locale);
	return c.json(result);
});

// =============================================================
// 2. GET /api/v1/share/r/:code & /:code (Tracked Redirection)
// =============================================================
async function handleRedirect(c: any, code: string) {
	const userAgent = c.req.header("user-agent") || "";
	const destinationUrl = await shareService.handleTrackedRedirect(code, userAgent);

	if (!destinationUrl) {
		return c.text("Short link not found or expired", 404);
	}

	return c.redirect(destinationUrl, 302);
}

shareApp.get("/r/:code", zValidator("param", codeParamSchema), async (c) => {
	const { code } = c.req.valid("param");
	return handleRedirect(c, code);
});

shareApp.get("/:code", zValidator("param", codeParamSchema), async (c) => {
	const { code } = c.req.valid("param");
	if (code === "generate" || code === "stats") return;
	return handleRedirect(c, code);
});

// =============================================================
// 3. GET /api/v1/share/stats/:code (Analytics query)
// =============================================================
shareApp.get("/stats/:code", zValidator("param", codeParamSchema), async (c) => {
	const { code } = c.req.valid("param");
	const user = c.get("user");
	const stats = await shareService.getLinkStats(code, user);
	return c.json(stats);
});
