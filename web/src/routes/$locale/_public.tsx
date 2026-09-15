import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { authClient } from "@/lib/auth-client";

/**
 * Public layout — wraps all publicly accessible pages.
 *
 * Optionally resolves the user session (non-blocking) so the header
 * can show "Login" vs. the user avatar. Does NOT redirect if no session.
 */
export const Route = createFileRoute("/$locale/_public")({
	beforeLoad: async () => {
		try {
			const { data } = await authClient.getSession();
			return { user: data?.user ?? null, session: data?.session ?? null };
		} catch {
			return { user: null, session: null };
		}
	},
	component: PublicLayout,
});

function PublicLayout() {
	const context = Route.useRouteContext();
	const user = context.user;

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Header user={user} />
			<main className="flex-1 pb-16 md:pb-0">
				<Outlet />
			</main>
			<Footer />
			<MobileNav isAuthenticated={Boolean(user)} />
		</div>
	);
}
