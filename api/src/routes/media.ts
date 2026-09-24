import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { createUserRateLimiter } from "../lib/rate-limiter";
import { signatureSchema, verifySchema } from "../schemas";
import { handleAppError, RateLimitError } from "../lib/errors";
import { mediaService } from "../services/media.service";

export const mediaApp = new Hono<{ Variables: { user: SessionUser } }>();

mediaApp.onError(handleAppError);

// -------------------------------------------------------------
// Per-user Rate Limiting for Signature Requests (30 reqs/min)
// -------------------------------------------------------------
const signatureRateLimiter = createUserRateLimiter(30);

export function resetSignatureRateLimits() {
	signatureRateLimiter.reset();
}

// POST /api/v1/media/signature (Authenticated & Rate-limited)
mediaApp.post("/signature", requireAuth(), zValidator("json", signatureSchema), async (c) => {
	const user = c.get("user");

	if (!signatureRateLimiter.check(user.id)) {
		throw new RateLimitError("Too Many Requests. Signature rate limit exceeded.", "RATE_LIMIT_EXCEEDED");
	}

	const signedParams = await mediaService.generateSignature(user, c.req.valid("json"));
	return c.json(signedParams);
});

// POST /api/v1/media/verify (Verifies upload before attaching)
mediaApp.post("/verify", requireAuth(), zValidator("json", verifySchema), async (c) => {
	const user = c.get("user");
	const result = await mediaService.verifyAsset(user, c.req.valid("json"));
	return c.json(result);
});
