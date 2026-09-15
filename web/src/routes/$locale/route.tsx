import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DirectionProvider } from "@/components/ui/direction";
import {
	isValidLocale,
	getDirection,
	DEFAULT_LOCALE,
	type SupportedLocale,
	type TextDirection,
} from "@/lib/i18n";

/**
 * Locale layout route — wraps all localized pages.
 *
 * Responsibilities:
 * 1. Validates the $locale param (redirects invalid values to default)
 * 2. Injects `locale` and `dir` into route context for child routes
 * 3. Wraps children in DirectionProvider for Base UI/Radix RTL support
 *
 * The root route reads locale/dir from this context to set <html lang/dir>.
 */
export const Route = createFileRoute("/$locale")({
	beforeLoad: ({ params }) => {
		const raw = params.locale;

		// Redirect invalid locale values to the default
		if (!isValidLocale(raw)) {
			throw redirect({
				to: "/$locale",
				params: { locale: DEFAULT_LOCALE },
				replace: true,
			});
		}

		const locale: SupportedLocale = raw;
		const dir: TextDirection = getDirection(locale);

		return { locale, dir };
	},
	component: LocaleLayout,
});

function LocaleLayout() {
	const { dir } = Route.useRouteContext();

	return (
		<DirectionProvider dir={dir}>
			<Outlet />
		</DirectionProvider>
	);
}
