import { useRouteContext } from "@tanstack/react-router";
import { dictionaries, type Dictionary } from "./messages";
import type { SupportedLocale, TextDirection } from "./locale";

type TranslationResult = {
	/** Current locale derived from URL */
	locale: SupportedLocale;
	/** Text direction: 'ltr' or 'rtl' */
	dir: TextDirection;
	/** Typed dictionary for the current locale */
	t: Dictionary;
};

/**
 * Access the current locale, direction, and translated UI strings.
 *
 * Must be called within a route that has locale/dir in its context
 * (any route under the `$locale` layout).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, dir } = useTranslation();
 *   return <button>{t.common.search}</button>;
 * }
 * ```
 */
export function useTranslation(): TranslationResult {
	const context = useRouteContext({ strict: false });
	const locale = (context as { locale?: SupportedLocale }).locale ?? "en";
	const dir = (context as { dir?: TextDirection }).dir ?? "ltr";
	const t = dictionaries[locale];

	return { locale, dir, t };
}
