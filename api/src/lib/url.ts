/**
 * Shared Canonical & Public URL Construction Helper (AGENTS.md §5)
 */

import type { ResolvableEntityType } from "./entity-resolver";

export const BASE_URL = process.env.BASE_URL || "https://sayaratak.com";

export type EntityUrlType = ResolvableEntityType;

/**
 * Builds the canonical relative path for an entity.
 */
export function buildEntityPath(type: EntityUrlType, identifier: string): string {
	const normalizedType = type.toLowerCase() as EntityUrlType;
	switch (normalizedType) {
		case "listing":
		case "vehicle":
			return `listings/${identifier}`;
		case "dealership":
		case "dealer":
			return `dealers/${identifier}`;
		case "workshop":
			return `workshops/${identifier}`;
		case "mechanic":
			return `mechanics/${identifier}`;
		case "category":
			return `category/${identifier}`;
		case "make":
			return `make/${identifier}`;
		case "page":
			return identifier;
		default:
			return `${type}/${identifier}`;
	}
}

/**
 * Builds a public-facing URL with optional locale prefix.
 * e.g. buildEntityUrl("listing", "123", "ar") => "https://sayaratak.com/ar/listings/123"
 */
export function buildEntityUrl(type: EntityUrlType, identifier: string, locale?: string): string {
	const entityPath = buildEntityPath(type, identifier);
	if (locale) {
		return `${BASE_URL}/${locale}/${entityPath}`;
	}
	return `${BASE_URL}/${entityPath}`;
}

/**
 * Ensures a URL or relative path is an absolute URL.
 */
export function ensureAbsoluteUrl(url?: string | null, fallback = `${BASE_URL}/sayaratak-og-default.jpg`): string {
	if (!url) return fallback;
	if (url.startsWith("http://") || url.startsWith("https://")) return url;
	return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
