/**
 * Only same-origin, root-relative paths are ever honored as a post-login redirect target.
 * Anything else (absolute URL, protocol-relative `//host`, javascript: scheme, etc.) falls
 * back to a safe default — this is the only place that decides what "safe" means here.
 */
export function getSafeRedirectPath(
	raw: string | null | undefined,
	fallback: string,
): string {
	if (!raw) return fallback;
	if (!raw.startsWith("/")) return fallback;
	if (raw.startsWith("//")) return fallback;
	if (raw.includes("\\")) return fallback;
	return raw;
}
