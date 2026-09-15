import { useState } from "react";
import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

/**
 * Dashboard layout — requires an authenticated session.
 *
 * Guards all authenticated user pages (my listings, favorites,
 * messages, settings, etc.). Redirects to login with a `?redirect=`
 * search param so the user returns here after signing in.
 *
 * Injects the validated `user` and `session` objects into route
 * context — child routes can access them without re-fetching.
 */
export const Route = createFileRoute("/$locale/_dashboard")({
	beforeLoad: async ({ location, params }) => {
		const { data } = await authClient.getSession();

		if (!data?.session || !data?.user) {
			throw redirect({
				to: "/$locale/_auth/login",
				params: { locale: params.locale },
				search: { redirect: location.href },
			});
		}

		// Check if the user is banned
		if (data.user.banned) {
			throw redirect({
				to: "/$locale/_public",
				params: { locale: params.locale },
			});
		}

		return {
			user: data.user,
			session: data.session,
		};
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const { user } = Route.useRouteContext();
	const { locale, dir } = useTranslation();
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

	return (
		<div className="flex min-h-screen bg-background text-foreground">
			{/* Desktop Sidebar (visible md+) */}
			<div className="hidden md:block">
				<DashboardSidebar user={user} />
			</div>

			{/* Main Workspace Area */}
			<div className="flex flex-1 flex-col min-w-0">
				{/* Mobile Header Bar */}
				<header className="flex h-16 items-center justify-between border-b border-border/80 px-4 md:hidden">
					<div className="flex items-center gap-3">
						<Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Open sidebar navigation">
									<Menu className="size-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side={dir === "rtl" ? "right" : "left"} className="p-0 w-72">
								<DashboardSidebar user={user} />
							</SheetContent>
						</Sheet>
						<Link to="/$locale/_public" params={{ locale }} className="flex items-center">
							<img
								src="/sayaratak-logo.svg"
								alt="Sayaratak"
								className="h-6 w-auto object-contain"
							/>
						</Link>
					</div>
					<span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
						{user.name}
					</span>
				</header>

				{/* Page Content */}
				<main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>

			{/* Mobile Bottom Navigation */}
			<MobileNav isAuthenticated={true} />
		</div>
	);
}
