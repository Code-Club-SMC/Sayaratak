import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { z } from "zod";
import {
	AppError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError,
	GoneError,
	RateLimitError,
	InternalError,
	handleAppError,
} from "../src/lib/errors";

describe("Typed Domain Errors & Centralized Error Handler", () => {
	test("Domain error classes set correct status code and default code", () => {
		const badRequest = new BadRequestError("Invalid input");
		expect(badRequest.statusCode).toBe(400);
		expect(badRequest.code).toBe("BAD_REQUEST");
		expect(badRequest.message).toBe("Invalid input");

		const unauthorized = new UnauthorizedError();
		expect(unauthorized.statusCode).toBe(401);
		expect(unauthorized.code).toBe("UNAUTHORIZED");

		const forbidden = new ForbiddenError();
		expect(forbidden.statusCode).toBe(403);
		expect(forbidden.code).toBe("FORBIDDEN");

		const notFound = new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		expect(notFound.statusCode).toBe(404);
		expect(notFound.code).toBe("LISTING_NOT_FOUND");

		const conflict = new ConflictError("Already exists", "ALREADY_EXISTS");
		expect(conflict.statusCode).toBe(409);
		expect(conflict.code).toBe("ALREADY_EXISTS");

		const gone = new GoneError("Listing is no longer available", "LISTING_GONE");
		expect(gone.statusCode).toBe(410);
		expect(gone.code).toBe("LISTING_GONE");

		const rateLimit = new RateLimitError();
		expect(rateLimit.statusCode).toBe(429);
		expect(rateLimit.code).toBe("RATE_LIMIT_EXCEEDED");

		const internal = new InternalError();
		expect(internal.statusCode).toBe(500);
		expect(internal.code).toBe("INTERNAL_ERROR");
	});

	test("handleAppError maps NotFoundError to 404 with structured payload", async () => {
		const app = new Hono();
		app.onError(handleAppError);

		app.get("/test", () => {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		});

		const res = await app.request("/test");
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error).toBe("Listing not found");
		expect(body.code).toBe("LISTING_NOT_FOUND");
	});

	test("handleAppError localizes error to Arabic when requested", async () => {
		const app = new Hono();
		app.onError(handleAppError);

		app.get("/test-ar", () => {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		});

		const res = await app.request("/test-ar", {
			headers: { "Accept-Language": "ar" },
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("Content-Language")).toBe("ar");
		const body = await res.json();
		expect(body.error).toBe("الإعلان غير موجود");
		expect(body.code).toBe("LISTING_NOT_FOUND");
	});

	test("handleAppError formats ZodError when thrown directly", async () => {
		const app = new Hono();
		app.onError(handleAppError);

		const schema = z.object({
			email: z.string().email(),
		});

		app.get("/test-zod", () => {
			schema.parse({ email: "invalid-email" });
		});

		const res = await app.request("/test-zod");
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.code).toBe("VALIDATION_ERROR");
		expect(body.details).toBeDefined();
		expect(body.details.length).toBeGreaterThan(0);
	});

	test("handleAppError catches unexpected errors as 500 INTERNAL_ERROR", async () => {
		const app = new Hono();
		app.onError(handleAppError);

		app.get("/test-unexpected", () => {
			throw new Error("Database crashed unexpectedly");
		});

		const res = await app.request("/test-unexpected");
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.code).toBe("INTERNAL_ERROR");
	});
});
