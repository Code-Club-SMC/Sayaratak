/**
 * Typed fetch wrapper for the Sayaratak backend API.
 *
 * Handles:
 * - Base URL resolution
 * - Cookie credentials (session auth)
 * - Accept-Language header injection from the current locale
 * - Structured error response parsing ({ error, code, details })
 */

const API_BASE_URL =
	typeof process !== "undefined" && process.env.API_BASE_URL
		? process.env.API_BASE_URL
		: "http://localhost:8000";

/**
 * Structured error from the backend.
 * See AGENTS.md §4: Error responses (status >= 400) return
 * { error: string, code: string, details?: any }
 */
export type ApiError = {
	error: string;
	code: string;
	details?: unknown;
	status: number;
};

export class ApiRequestError extends Error {
	public readonly status: number;
	public readonly code: string;
	public readonly details?: unknown;

	constructor(apiError: ApiError) {
		super(apiError.error);
		this.name = "ApiRequestError";
		this.status = apiError.status;
		this.code = apiError.code;
		this.details = apiError.details;
	}
}

type FetchOptions = Omit<RequestInit, "body"> & {
	/** Locale for Accept-Language header */
	locale?: string;
	/** JSON body — auto-serialized and Content-Type set */
	body?: unknown;
	/** Query parameters — appended to URL */
	params?: Record<string, string | number | boolean | undefined>;
};

/**
 * Build the full URL with query params.
 */
function buildUrl(path: string, params?: FetchOptions["params"]): string {
	const url = new URL(path, API_BASE_URL);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	return url.toString();
}

function safeJsonParse(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}

/**
 * Core fetch function. All API calls go through this.
 */
export async function api<T>(
	path: string,
	options: FetchOptions = {},
): Promise<T> {
	const {
		locale,
		body,
		params,
		headers: customHeaders,
		...fetchOpts
	} = options;

	const headers = new Headers(customHeaders);

	// Always send credentials (session cookie)
	fetchOpts.credentials = "include";

	// Set Accept-Language from the current locale
	if (locale) {
		headers.set("Accept-Language", locale);
	}

	// Auto-serialize JSON body
	if (body !== undefined && body !== null) {
		headers.set("Content-Type", "application/json");
		(fetchOpts as RequestInit).body = JSON.stringify(body);
	}

	const url = buildUrl(path, params);
	const response = await fetch(url, { ...fetchOpts, headers });

	// Handle no-content responses
	if (response.status === 204) {
		return undefined as T;
	}

	const text = await response.text();
	const data = text ? safeJsonParse(text) : undefined;

	if (!response.ok) {
		const errorObject =
			data && typeof data === "object" && !Array.isArray(data)
				? (data as Record<string, unknown>)
				: {};

		throw new ApiRequestError({
			error:
				typeof errorObject.error === "string"
					? errorObject.error
					: "An unexpected error occurred",
			code:
				typeof errorObject.code === "string"
					? errorObject.code
					: "UNKNOWN_ERROR",
			details: errorObject.details,
			status: response.status,
		});
	}

	return data as T;
}

/**
 * Convenience methods for common HTTP verbs.
 */
export const apiGet = <T>(path: string, options?: FetchOptions) =>
	api<T>(path, { ...options, method: "GET" });

export const apiPost = <T>(
	path: string,
	body?: unknown,
	options?: FetchOptions,
) => api<T>(path, { ...options, method: "POST", body });

export const apiPut = <T>(
	path: string,
	body?: unknown,
	options?: FetchOptions,
) => api<T>(path, { ...options, method: "PUT", body });

export const apiPatch = <T>(
	path: string,
	body?: unknown,
	options?: FetchOptions,
) => api<T>(path, { ...options, method: "PATCH", body });

export const apiDelete = <T>(path: string, options?: FetchOptions) =>
	api<T>(path, { ...options, method: "DELETE" });
