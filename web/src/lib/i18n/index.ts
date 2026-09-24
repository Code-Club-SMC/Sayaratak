/**
 * i18n barrel export.
 *
 * Usage in components:
 *   import { useTranslation } from "@/lib/i18n";
 *   const { t, locale, dir } = useTranslation();
 *   <span>{t.common.search}</span>
 */

export {
	DEFAULT_LOCALE,
	getDirection,
	isValidLocale,
	resolveLocale,
	SUPPORTED_LOCALES,
	type SupportedLocale,
	type TextDirection,
} from "./locale";

export { type Dictionary, dictionaries } from "./messages";

export { useTranslation } from "./use-translation";
