import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import "../globals.css";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Sayaratak — Buy, Sell & Rent Vehicles" },
		],
		links: [{ rel: "icon", href: "/favicon.ico" }],
	}),
	component: RootComponent,
});

function RootComponent() {
	const { queryClient } = Route.useRouteContext();

	return (
		<QueryClientProvider client={queryClient}>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</QueryClientProvider>
	);
}

/**
 * Root HTML document wrapper.
 *
 * Reads locale/dir from the matched route context (set by `$locale/route.tsx`)
 * so that the SSR response has the correct `lang` and `dir` attributes on
 * `<html>`. Falls back to 'en'/'ltr' for routes outside the locale layout
 * (e.g. the bare `/` redirect).
 */
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	// Read the locale context from the router's current matches
	const routerState = useRouterState();
	const localeMatch = routerState.matches.find(
		(m) => m.context && "locale" in m.context,
	);
	const locale = (localeMatch?.context as { locale?: string })?.locale ?? "en";
	const dir = (localeMatch?.context as { dir?: string })?.dir ?? "ltr";

	return (
		<html lang={locale} dir={dir}>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background font-sans text-foreground antialiased">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
