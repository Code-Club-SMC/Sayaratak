import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth, type SessionUser } from "../middleware/auth";
import { createUserRateLimiter } from "../lib/rate-limiter";
import { handleAppError, RateLimitError } from "../lib/errors";
import { paymentsService } from "../services/payments.service";
import {
	getPackagesQuerySchema,
	checkoutSchema,
	submitPaymentSchema,
	idParamSchema,
} from "../schemas";

export const paymentsApp = new Hono<{ Variables: { user: SessionUser } }>();

paymentsApp.onError(handleAppError);

// §6: Per-user rate limiting for payment checkout (15 reqs/min)
const checkoutRateLimiter = createUserRateLimiter(15);

// GET /api/v1/payments/packages
// Public endpoint: list active subscription packages for pricing page
paymentsApp.get("/packages", zValidator("query", getPackagesQuerySchema), async (c) => {
	const { roleTarget } = c.req.valid("query");
	const pkgs = await paymentsService.listPackages(roleTarget);
	return c.json(pkgs);
});

// POST /api/payments/checkout
// Create a pending payment intent
paymentsApp.post("/checkout", requireAuth(), zValidator("json", checkoutSchema), async (c) => {
	const user = c.get("user");

	if (!checkoutRateLimiter.check(user.id)) {
		throw new RateLimitError(
			"Too Many Requests. Checkout rate limit exceeded.",
			"RATE_LIMIT_EXCEEDED",
		);
	}

	const body = c.req.valid("json");
	const payment = await paymentsService.createCheckout(user, body);
	return c.json(payment, 201);
});

// POST /api/payments/:id/submit
// Submit the Bankak transaction ID for manual verification
paymentsApp.post(
	"/:id/submit",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", submitPaymentSchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const { transactionId } = c.req.valid("json");
		const updated = await paymentsService.submitPayment(id, user, transactionId);
		return c.json(updated);
	},
);
