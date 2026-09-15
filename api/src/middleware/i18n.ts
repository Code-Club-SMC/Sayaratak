import { createMiddleware } from "hono/factory";
import {
	resolveLocale,
	localizeError,
	formatZodValidationErrors,
	type SupportedLocale,
} from "../lib/i18n";

export const i18nMiddleware = createMiddleware<{
	Variables: {
		locale: SupportedLocale;
	};
}>(async (c, next) => {
	const locale = resolveLocale(c.req);
	c.set("locale", locale);

	await next();

	// Set standard HTTP Localization headers
	c.header("Content-Language", locale);
	c.header("Vary", "Accept-Language");

	if (c.res && c.res.status >= 400) {
		const contentType = c.res.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			try {
				const bodyText = await c.res.text();
				const parsed = JSON.parse(bodyText);

				if (parsed && typeof parsed === "object") {
					let updatedPayload: any = null;

					// Case A: Zod Error with issues array or serialized message
					let zodIssues: any[] | null = null;
					if (Array.isArray(parsed.error?.issues)) {
						zodIssues = parsed.error.issues;
					} else if (parsed.error?.name === "ZodError" && typeof parsed.error.message === "string") {
						try {
							const issuesFromJson = JSON.parse(parsed.error.message);
							if (Array.isArray(issuesFromJson)) {
								zodIssues = issuesFromJson;
							}
						} catch {}
					} else if (Array.isArray(parsed.issues)) {
						zodIssues = parsed.issues;
					} else if (Array.isArray(parsed.details)) {
						zodIssues = parsed.details;
					}

					if (Array.isArray(zodIssues) && zodIssues.length > 0) {
						const formatted = formatZodValidationErrors(zodIssues, locale);
						updatedPayload = {
							success: false,
							error: formatted.error,
							code: formatted.code,
							details: formatted.details,
						};
					}
					// Case B: Standard string error (e.g. { error: "Unauthorized" })
					else if (typeof parsed.error === "string") {
						const localized = localizeError(parsed.error, locale);
						updatedPayload = {
							...parsed,
							error: localized.error,
							code: parsed.code || localized.code,
						};
					}

					const headers = new Headers(c.res.headers);
					headers.set("Content-Type", "application/json");
					headers.set("Content-Language", locale);
					headers.set("Vary", "Accept-Language");

					c.res = new Response(JSON.stringify(updatedPayload || parsed), {
						status: c.res.status,
						headers,
					});
					return;
				}

				// If not an object, restore original text
				const headers = new Headers(c.res.headers);
				c.res = new Response(bodyText, {
					status: c.res.status,
					headers,
				});
			} catch {
				// Retain original response on error
			}
		}
	}
});
