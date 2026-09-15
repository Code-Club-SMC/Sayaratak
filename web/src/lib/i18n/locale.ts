/**
 * Supported locales and direction mapping.
 *
 * URL is the single source of truth for locale — no cookies, no localStorage.
 * The $locale route param is validated in the locale layout route.
 */

export type SupportedLocale = "en" | "ar";
export type TextDirection = "ltr" | "rtl";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["en", "ar"];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export function isValidLocale(value: unknown): value is SupportedLocale {
	return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function getDirection(locale: SupportedLocale): TextDirection {
	return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Resolve a raw locale param from the URL into a valid SupportedLocale.
 * Falls back to DEFAULT_LOCALE for invalid/missing values.
 */
export function resolveLocale(raw: string | undefined): SupportedLocale {
	if (raw && isValidLocale(raw)) {
		return raw;
	}
	return DEFAULT_LOCALE;
}
