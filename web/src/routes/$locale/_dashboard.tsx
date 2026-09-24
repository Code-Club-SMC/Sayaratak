import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { NavUser } from "#/components/domain/dashboard/nav-user";
import { Button } from "#/components/ui/button";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
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
		let sessionData = null;

		try {
			const { data } = await authClient.getSession();
			sessionData = data;
		} catch (error) {
			console.warn("Auth session check failed:", error);
		}

		if (!sessionData?.session || !sessionData?.user) {
			throw redirect({
				to: "/$locale/login",
				params: { locale: params.locale },
				search: { redirect: location.href },
			});
		}

		// Check if the user is banned
		if (sessionData.user.banned) {
			throw redirect({
				to: "/$locale",
				params: { locale: params.locale },
			});
		}

		return {
			user: sessionData.user,
			session: sessionData.session,
		};
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const { user } = Route.useRouteContext();
	const { locale } = Route.useParams();
	const { dir } = useTranslation();

	// SidebarProvider will inject the dir (rtl/ltr) and handle mobile state automatically
	return (
		<SidebarProvider>
			<DashboardSidebar user={user} />
			<SidebarInset className="overflow-hidden flex flex-col h-screen">
				{/* Global Header (Navbar) */}
				<header className="flex h-24 items-center justify-between border-b mr-4">
					<SidebarTrigger />

					<div className="flex items-center gap-x-3">
						<Button
							asChild
							variant={"outline"}
							className="border border-primary text-primary hover:border-primary hover:text-primary"
						>
							<Link to="/$locale/dashboard/listings/new" params={{ locale }}>
								Post an Ad
								<PlusIcon />
							</Link>
						</Button>
						<NavUser user={user} />
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
