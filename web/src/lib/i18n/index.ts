/**
 * i18n barrel export.
 *
 * Usage in components:
 *   import { useTranslation } from "@/lib/i18n";
 *   const { t, locale, dir } = useTranslation();
 *   <span>{t.common.search}</span>
 */

export {
	type SupportedLocale,
	type TextDirection,
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	isValidLocale,
	getDirection,
	resolveLocale,
} from "./locale";

export { dictionaries, type Dictionary } from "./messages";

export { useTranslation } from "./use-translation";
