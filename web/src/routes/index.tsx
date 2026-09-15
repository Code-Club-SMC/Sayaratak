import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * Root index route — redirects bare "/" to the default locale.
 *
 * This ensures every page always has a locale segment in the URL,
 * making locale detection deterministic (no cookies/localStorage needed).
 */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/$locale", params: { locale: DEFAULT_LOCALE } });
	},
});
