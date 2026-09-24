import { ZodError } from "zod";
import { resolveLocale, localizeError, formatZodValidationErrors, t, type SupportedLocale } from "./i18n";

/**
 * Base Application Domain Error (AGENTS.md §4)
 */
export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code: string;
	public readonly details?: any;
	public readonly params?: Record<string, string | number>;

	constructor(
		message: string,
		statusCode = 500,
		code = "INTERNAL_ERROR",
		details?: any,
		params?: Record<string, string | number>,
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
		this.params = params;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request", code = "BAD_REQUEST", details?: any, params?: Record<string, string | number>) {
		super(message, 400, code, details, params);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
		super(message, 401, code);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden", code = "FORBIDDEN") {
		super(message, 403, code);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Not found", code = "NOT_FOUND") {
		super(message, 404, code);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict", code = "CONFLICT") {
		super(message, 409, code);
	}
}

export class GoneError extends AppError {
	constructor(message = "Resource gone", code = "RESOURCE_GONE") {
		super(message, 410, code);
	}
}

export class RateLimitError extends AppError {
	constructor(message = "Too Many Requests", code = "RATE_LIMIT_EXCEEDED") {
		super(message, 429, code);
	}
}

export class InternalError extends AppError {
	constructor(message = "Internal Server Error", code = "INTERNAL_ERROR") {
		super(message, 500, code);
	}
}

/**
 * Centralized Hono error handler for domain errors, Zod errors, and unhandled exceptions.
 */
export function handleAppError(err: unknown, c: any): Response {
	const locale: SupportedLocale = c.get ? (c.get("locale") || resolveLocale(c.req)) : resolveLocale(c.req);

	if (err instanceof AppError) {
		const localized = localizeError(err.message, locale, err.params);
		const payload: { error: string; code: string; details?: any } = {
			error: localized.error,
			code: err.code || localized.code,
		};
		if (err.details !== undefined) {
			payload.details = err.details;
		}

		c.header?.("Content-Language", locale);
		c.header?.("Vary", "Accept-Language");
		return c.json(payload, err.statusCode);
	}

	if (err instanceof ZodError) {
		const formatted = formatZodValidationErrors(err.issues, locale);
		c.header?.("Content-Language", locale);
		c.header?.("Vary", "Accept-Language");
		return c.json(
			{
				success: false,
				error: formatted.error,
				code: formatted.code,
				details: formatted.details,
			},
			400,
		);
	}

	const message = err instanceof Error ? err.message : String(err);
	const stack = err instanceof Error ? err.stack : undefined;
	console.error(`[Unhandled Error] ${message}`, stack);

	c.header?.("Content-Language", locale);
	c.header?.("Vary", "Accept-Language");
	return c.json(
		{
			error: t("INTERNAL_ERROR", locale),
			code: "INTERNAL_ERROR",
		},
		500,
	);
}
