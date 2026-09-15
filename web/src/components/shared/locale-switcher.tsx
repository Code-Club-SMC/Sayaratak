import { useNavigate, useMatches } from "@tanstack/react-router";
import { useTranslation, type SupportedLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * Locale switcher — toggles between English and Arabic.
 *
 * Preserves the current route path and search params, only swapping
 * the $locale segment in the URL.
 */
export function LocaleSwitcher() {
	const { locale } = useTranslation();
	const navigate = useNavigate();
	const matches = useMatches();

	const targetLocale: SupportedLocale = locale === "en" ? "ar" : "en";
	const label = locale === "en" ? "العربية" : "English";

	function handleSwitch() {
		// Get the current full path and swap the locale segment
		const currentMatch = matches[matches.length - 1];
		if (!currentMatch) return;

		const currentPath = currentMatch.fullPath;
		// Replace the locale segment in the path
		const newPath = currentPath.replace(
			`/${locale}`,
			`/${targetLocale}`,
		);

		navigate({
			to: newPath,
			params: (prev: Record<string, string>) => ({
				...prev,
				locale: targetLocale,
			}),
			search: (prev: Record<string, unknown>) => prev,
			replace: true,
		});
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSwitch}
			className="text-sm font-medium"
			aria-label={`Switch to ${targetLocale === "ar" ? "Arabic" : "English"}`}
		>
			{label}
		</Button>
	);
}
