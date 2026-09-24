import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowRight,
	Bell,
	FileText,
	Heart,
	Home,
	MessageSquare,
	Settings,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

type DashboardUser = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
	accountType?: string;
};

type DashboardSidebarProps = {
	user: DashboardUser;
};

export function DashboardSidebar({ user }: DashboardSidebarProps) {
	const { t, locale } = useTranslation();
	const navigate = useNavigate();

	async function _handleLogout() {
		await authClient.signOut();
		navigate({
			to: "/$locale",
			params: { locale },
		});
	}

	const _isBusiness =
		user.accountType === "dealership" ||
		user.accountType === "workshop" ||
		user.accountType === "mechanic";

	const navItems = [
		{
			label: t.nav.overview || "Overview",
			icon: Home,
			to: "/$locale/dashboard" as const,
		},
		{
			label: t.nav.myListings || "My Listings",
			icon: FileText,
			to: "/$locale/dashboard/listings" as const,
		},
		{
			label: t.nav.savedSearches || "Saved Searches",
			icon: Heart,
			to: "/$locale/dashboard/saved-searches" as const,
		},
		{
			label: t.nav.favorites || "Favorite Listings",
			icon: Heart,
			to: "/$locale/dashboard/favorites" as const,
		},
		{
			label: t.nav.messages || "Messages",
			icon: MessageSquare,
			to: "/$locale/dashboard/messages" as const,
			badge: 5,
		},
		{
			label: t.nav.notifications || "Notifications",
			icon: Bell,
			to: "/$locale/dashboard/notifications" as const,
			badge: 7,
		},
		{
			label: t.common.settings || "Account Settings",
			icon: Settings,
			to: "/$locale/dashboard/settings" as const,
		},
	];

	return (
		<Sidebar variant="floating">
			<SidebarHeader className="h-[88px] shrink-0 px-6 border-b border-slate-200 flex flex-col justify-center">
				<img
					src="/sayaratak-logo.svg"
					alt="Sayaratak Logo"
					className="h-24 w-auto object-contain"
				/>
			</SidebarHeader>
			<SidebarContent className="pt-6">
				<div className="px-6 mb-4">
					<h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
						My Account
					</h3>
				</div>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="gap-1 px-3">
							{navItems.map((item) => {
								const Icon = item.icon;
								return (
									<SidebarMenuItem key={item.label} className="w-full">
										<Link
											to={item.to}
											params={{ locale }}
											activeOptions={{
												exact: item.to === "/$locale/dashboard",
											}}
											activeProps={{
												className: "bg-blue-50 text-blue-600 font-semibold",
											}}
											inactiveProps={{
												className:
													"text-slate-600 font-medium hover:bg-slate-50",
											}}
											className="flex items-center w-full h-10 rounded-md px-3 outline-none transition-colors"
										>
											<div className="flex items-center gap-3 flex-1">
												<Icon className="size-[18px] shrink-0" />
												<span className="text-[13px]">{item.label}</span>
											</div>
											{item.badge && (
												<div className="bg-blue-600 text-white text-[10px] size-5 flex items-center justify-center rounded-full shrink-0 font-bold ml-auto">
													{item.badge}
												</div>
											)}
										</Link>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="p-4 space-y-4">
				{/* Stand out and sell faster */}
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
					<div className="flex items-center gap-3 mb-2">
						<div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
							<FileText className="size-4" />
						</div>
						<h4 className="font-semibold text-sm text-slate-900 leading-tight">
							Stand out and sell faster
						</h4>
					</div>
					<p className="text-xs text-slate-500 mb-4 leading-relaxed">
						Promote your listings to get more views and reach serious buyers.
					</p>
					<Button
						className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 font-medium rounded-lg"
						size="sm"
					>
						<Zap className="size-4" />
						Promote a Listing
					</Button>
				</div>

				{/* Need Help */}
				<div className="rounded-xl bg-transparent p-2">
					<h4 className="font-semibold text-sm text-slate-900 mb-2">
						Need Help?
					</h4>
					<p className="text-xs text-slate-500 mb-4 leading-relaxed">
						Check our posting guide or contact our support team.
					</p>
					<Link
						to="/$locale"
						params={{ locale }}
						className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline"
					>
						View Posting Guide <ArrowRight className="size-4" />
					</Link>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
