import { Link, useNavigate } from "@tanstack/react-router";
import {
	BarChart3,
	Car,
	CreditCard,
	FileText,
	Flag,
	Image,
	LogOut,
	MapPin,
	Package,
	Send,
	ShieldCheck,
	Store,
	Tags,
	Users,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

type AdminSidebarProps = {
	adminUser: {
		id: string;
		name: string;
		email: string;
	};
};

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
	const { t, locale } = useTranslation();
	const navigate = useNavigate();

	async function handleLogout() {
		await authClient.signOut();
		navigate({
			to: "/$locale",
			params: { locale },
		});
	}

	const navSections = [
		{
			title: t.admin.dashboard,
			items: [
				{
					label: t.admin.metrics,
					icon: BarChart3,
					to: "/$locale/admin" as const,
				},
			],
		},
		{
			title: "Moderation",
			items: [
				{
					label: t.admin.users,
					icon: Users,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.listings,
					icon: Car,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.reports,
					icon: Flag,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.payments,
					icon: CreditCard,
					to: "/$locale/admin" as const,
				},
			],
		},
		{
			title: "Platform Content",
			items: [
				{
					label: t.admin.taxonomy,
					icon: Tags,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.locations,
					icon: MapPin,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.subscriptions,
					icon: Package,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.banners,
					icon: Image,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.pages,
					icon: FileText,
					to: "/$locale/admin" as const,
				},
				{
					label: t.admin.broadcast,
					icon: Send,
					to: "/$locale/admin" as const,
				},
			],
		},
	];

	return (
		<aside className="w-64 border-e border-border/80 bg-slate-950 text-slate-100 flex flex-col justify-between shrink-0 min-h-screen">
			{/* Top: Admin Logo & Header */}
			<div className="overflow-y-auto">
				{/* Logo & Admin Badge */}
				<div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Link
							to="/$locale"
							params={{ locale }}
							className="flex items-center gap-2"
						>
							<img
								src="/sayaratak-logo.svg"
								alt="Sayaratak"
								className="h-7 w-auto object-contain brightness-0 invert"
							/>
						</Link>
						<Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] uppercase font-bold tracking-wider">
							Admin
						</Badge>
					</div>
					<LocaleSwitcher />
				</div>

				{/* Admin Profile Info */}
				<div className="p-4 border-b border-slate-800 flex items-center gap-3">
					<div className="size-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
						<ShieldCheck className="size-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold truncate text-slate-100">
							{adminUser.name}
						</p>
						<p className="text-xs text-slate-400 truncate">{adminUser.email}</p>
					</div>
				</div>

				{/* Navigation Links Grouped by Section */}
				<nav className="p-3 space-y-6">
					{navSections.map((section) => (
						<div key={section.title} className="space-y-1">
							<p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
								{section.title}
							</p>
							{section.items.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.label}
										to={item.to}
										params={{ locale }}
										className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
										activeProps={{
											className:
												"bg-amber-500/20 text-amber-300 font-semibold hover:bg-amber-500/25",
										}}
									>
										<Icon className="size-4 shrink-0 text-slate-400" />
										<span className="truncate">{item.label}</span>
									</Link>
								);
							})}
						</div>
					))}
				</nav>
			</div>

			{/* Bottom: Back to marketplace & Logout */}
			<div className="p-4 border-t border-slate-800 space-y-2">
				<Button
					variant="ghost"
					className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white gap-3 text-sm"
					asChild
				>
					<Link to="/$locale" params={{ locale }}>
						<Store className="size-4" />
						<span>{t.nav.backToSite}</span>
					</Link>
				</Button>

				<Button
					variant="ghost"
					onClick={handleLogout}
					className="w-full justify-start text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-3 text-sm"
				>
					<LogOut className="size-4" />
					<span>{t.common.logout}</span>
				</Button>
			</div>
		</aside>
	);
}
