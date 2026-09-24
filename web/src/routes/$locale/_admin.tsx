import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

/**
 * Admin layout — requires authentication + admin role.
 *
 * Guards all admin dashboard pages. Only users with `role === 'admin'`
 * can access routes under this layout. Non-admins get a 403-equivalent
 * redirect.
 */
export const Route = createFileRoute("/$locale/_admin")({
	beforeLoad: async ({ location, params }) => {
		const { data } = await authClient.getSession();

		if (!data?.session || !data?.user) {
			throw redirect({
				to: "/$locale/login",
				params: { locale: params.locale },
				search: { redirect: location.href },
			});
		}

		if (data.user.role !== "admin") {
			// Non-admin authenticated users get sent to the public home
			throw redirect({
				to: "/$locale",
				params: { locale: params.locale },
			});
		}

		return {
			user: data.user,
			session: data.session,
		};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { user } = Route.useRouteContext();
	const { locale, dir } = useTranslation();
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

	return (
		<div className="flex min-h-screen bg-slate-900 text-slate-100">
			{/* Desktop Admin Sidebar (visible lg+) */}
			<div className="hidden lg:block">
				<AdminSidebar adminUser={user} />
			</div>

			{/* Admin Main Workspace */}
			<div className="flex flex-1 flex-col min-w-0 bg-background text-foreground">
				{/* Mobile Admin Header */}
				<header className="flex h-16 items-center justify-between border-b border-border/80 px-4 lg:hidden bg-card">
					<div className="flex items-center gap-3">
						<Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Open admin navigation"
								>
									<Menu className="size-5" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side={dir === "rtl" ? "right" : "left"}
								className="p-0 w-72 bg-slate-950 border-slate-800"
							>
								<AdminSidebar adminUser={user} />
							</SheetContent>
						</Sheet>
						<Link
							to="/$locale/admin"
							params={{ locale }}
							className="flex items-center gap-2"
						>
							<img
								src="/sayaratak-logo.svg"
								alt="Sayaratak"
								className="h-6 w-auto object-contain"
							/>
							<Badge className="bg-amber-500/20 text-amber-500 border-amber-500/40 text-[10px] uppercase font-bold">
								Admin
							</Badge>
						</Link>
					</div>
					<span className="text-xs text-muted-foreground truncate max-w-[150px]">
						{user.name}
					</span>
				</header>

				{/* Admin Page Content */}
				<main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
