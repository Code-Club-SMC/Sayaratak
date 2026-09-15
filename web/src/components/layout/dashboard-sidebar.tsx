import { Link, useNavigate } from "@tanstack/react-router";
import {
	LayoutDashboard,
	Car,
	PlusCircle,
	MessageSquare,
	Bell,
	Heart,
	Bookmark,
	Building2,
	Star,
	CreditCard,
	Settings,
	ShieldAlert,
	Store,
	LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useTranslation } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";

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

	async function handleLogout() {
		await authClient.signOut();
		navigate({
			to: "/$locale/_public",
			params: { locale },
		});
	}

	const isBusiness =
		user.accountType === "dealership" ||
		user.accountType === "workshop" ||
		user.accountType === "mechanic";

	const navItems = [
		{
			label: t.nav.overview,
			icon: LayoutDashboard,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.myListings,
			icon: Car,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.messages,
			icon: MessageSquare,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.notifications,
			icon: Bell,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.favorites,
			icon: Heart,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.savedSearches,
			icon: Bookmark,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		...(isBusiness
			? [
					{
						label: t.nav.profile,
						icon: Building2,
						to: "/$locale/_dashboard/dashboard" as const,
					},
				]
			: []),
		{
			label: t.nav.reviews,
			icon: Star,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.nav.subscription,
			icon: CreditCard,
			to: "/$locale/_dashboard/dashboard" as const,
		},
		{
			label: t.common.settings,
			icon: Settings,
			to: "/$locale/_dashboard/dashboard" as const,
		},
	];

	return (
		<aside className="w-64 border-e border-border/80 bg-card flex flex-col justify-between shrink-0 min-h-screen">
			{/* Top: Brand & User Header */}
			<div>
				{/* Logo / Home header */}
				<div className="h-16 px-6 border-b border-border/60 flex items-center justify-between">
					<Link to="/$locale/_public" params={{ locale }} className="flex items-center gap-2">
						<img
							src="/sayaratak-logo.svg"
							alt="Sayaratak"
							className="h-7 w-auto object-contain"
						/>
					</Link>
					<LocaleSwitcher />
				</div>

				{/* User Profile Summary */}
				<div className="p-4 border-b border-border/60 flex items-center gap-3">
					<Avatar className="size-10 border border-border">
						<AvatarImage src={user.image ?? undefined} alt={user.name} />
						<AvatarFallback className="bg-primary/10 font-semibold text-primary">
							{user.name?.slice(0, 2).toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold truncate leading-snug">{user.name}</p>
						<p className="text-xs text-muted-foreground truncate leading-none mt-0.5">{user.email}</p>
						{user.accountType && user.accountType !== "user" && (
							<div className="mt-1">
								<Badge variant="secondary" className="text-[10px] uppercase font-semibold py-0 px-1.5">
									{user.accountType}
								</Badge>
							</div>
						)}
					</div>
				</div>

				{/* Create Listing Button */}
				<div className="p-4">
					<Button className="w-full gap-2 font-medium" asChild>
						<Link to="/$locale/_dashboard/dashboard" params={{ locale }}>
							<PlusCircle className="size-4" />
							<span>{t.nav.postAd}</span>
						</Link>
					</Button>
				</div>

				{/* Navigation Links */}
				<nav className="px-3 space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.label}
								to={item.to}
								params={{ locale }}
								className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
								activeProps={{
									className: "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary",
								}}
							>
								<Icon className="size-4 shrink-0" />
								<span className="truncate">{item.label}</span>
							</Link>
						);
					})}

					{/* Admin shortcut if user is admin */}
					{user.role === "admin" && (
						<Link
							to="/$locale/_admin/admin"
							params={{ locale }}
							className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-amber-600 hover:bg-amber-500/10 transition-colors mt-2"
						>
							<ShieldAlert className="size-4 shrink-0" />
							<span className="truncate">{t.nav.adminPanel}</span>
						</Link>
					)}
				</nav>
			</div>

			{/* Bottom: Back to marketplace & Logout */}
			<div className="p-4 border-t border-border/60 space-y-2">
				<Button
					variant="ghost"
					className="w-full justify-start text-muted-foreground hover:text-foreground gap-3 text-sm"
					asChild
				>
					<Link to="/$locale/_public" params={{ locale }}>
						<Store className="size-4" />
						<span>{t.nav.backToSite}</span>
					</Link>
				</Button>

				<Button
					variant="ghost"
					onClick={handleLogout}
					className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive gap-3 text-sm"
				>
					<LogOut className="size-4" />
					<span>{t.common.logout}</span>
				</Button>
			</div>
		</aside>
	);
}
