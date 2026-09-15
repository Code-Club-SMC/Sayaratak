import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	Search,
	Plus,
	Menu,
	User,
	LogOut,
	LayoutDashboard,
	Car,
	MessageSquare,
	Heart,
	Settings,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useTranslation } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";

type HeaderUser = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
	accountType?: string;
};

type HeaderProps = {
	user?: HeaderUser | null;
};

export function Header({ user }: HeaderProps) {
	const { t, locale, dir } = useTranslation();
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);

	async function handleLogout() {
		await authClient.signOut();
		navigate({
			to: "/$locale/_public",
			params: { locale },
		});
	}

	const navItems = [
		{ label: t.common.cars, to: "/$locale/_public" as const },
		{ label: t.common.dealerships, to: "/$locale/_public" as const },
		{ label: t.common.workshops, to: "/$locale/_public" as const },
		{ label: t.common.mechanics, to: "/$locale/_public" as const },
		{ label: t.common.pricing, to: "/$locale/_public" as const },
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
			<div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
				{/* Brand Logo & Desktop Nav */}
				<div className="flex items-center gap-6 lg:gap-8">
					<Link
						to="/$locale/_public"
						params={{ locale }}
						className="flex items-center gap-2 transition-opacity hover:opacity-90"
					>
						<img
							src="/sayaratak-logo.svg"
							alt="Sayaratak"
							className="h-8 w-auto object-contain"
						/>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center gap-6 text-sm font-medium">
						{navItems.map((item) => (
							<Link
								key={item.label}
								to={item.to}
								params={{ locale }}
								className="text-muted-foreground transition-colors hover:text-foreground"
								activeProps={{ className: "text-primary font-semibold" }}
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>

				{/* Header Actions (End Side) */}
				<div className="flex items-center gap-3">
					{/* Locale Switcher */}
					<LocaleSwitcher />

					{/* User Profile or Login/Register */}
					{user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative flex items-center gap-2 rounded-full p-1 sm:px-2"
								>
									<Avatar className="size-8 border border-border">
										<AvatarImage src={user.image ?? undefined} alt={user.name} />
										<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
											{user.name?.slice(0, 2).toUpperCase() || "U"}
										</AvatarFallback>
									</Avatar>
									<span className="hidden text-sm font-medium md:inline-block max-w-[120px] truncate">
										{user.name}
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align={dir === "rtl" ? "start" : "end"}
								className="w-56"
							>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{user.name}</p>
										<p className="text-xs leading-none text-muted-foreground truncate">
											{user.email}
										</p>
										{user.accountType && user.accountType !== "user" && (
											<div className="pt-1">
												<Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider">
													{user.accountType}
												</Badge>
											</div>
										)}
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link
										to="/$locale/_dashboard/dashboard"
										params={{ locale }}
										className="flex w-full items-center gap-2 cursor-pointer"
									>
										<LayoutDashboard className="size-4" />
										<span>{t.nav.overview}</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/$locale/_dashboard/dashboard"
										params={{ locale }}
										className="flex w-full items-center gap-2 cursor-pointer"
									>
										<Car className="size-4" />
										<span>{t.nav.myListings}</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/$locale/_dashboard/dashboard"
										params={{ locale }}
										className="flex w-full items-center gap-2 cursor-pointer"
									>
										<MessageSquare className="size-4" />
										<span>{t.nav.messages}</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/$locale/_dashboard/dashboard"
										params={{ locale }}
										className="flex w-full items-center gap-2 cursor-pointer"
									>
										<Heart className="size-4" />
										<span>{t.nav.favorites}</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/$locale/_dashboard/dashboard"
										params={{ locale }}
										className="flex w-full items-center gap-2 cursor-pointer"
									>
										<Settings className="size-4" />
										<span>{t.common.settings}</span>
									</Link>
								</DropdownMenuItem>
								{user.role === "admin" && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link
												to="/$locale/_admin/admin"
												params={{ locale }}
												className="flex w-full items-center gap-2 text-primary font-medium cursor-pointer"
											>
												<ShieldAlert className="size-4" />
												<span>{t.nav.adminPanel}</span>
											</Link>
										</DropdownMenuItem>
									</>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
								>
									<LogOut className="size-4 me-2" />
									<span>{t.common.logout}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<div className="hidden sm:flex items-center gap-2">
							<Button variant="ghost" size="sm" asChild>
								<Link to="/$locale/_auth/login" params={{ locale }}>
									{t.common.login}
								</Link>
							</Button>
						</div>
					)}

					{/* Post Ad CTA Button */}
					<Button
						size="sm"
						className="gap-1.5 shadow-sm font-semibold"
						asChild
					>
						<Link
							to={user ? "/$locale/_dashboard/dashboard" : "/$locale/_auth/login"}
							params={{ locale }}
						>
							<Plus className="size-4" />
							<span>{t.nav.postAd}</span>
						</Link>
					</Button>

					{/* Mobile Menu Hamburger */}
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								aria-label="Open menu"
							>
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 sm:w-80">
							<SheetHeader className="text-start pb-4 border-b border-border">
								<SheetTitle>
									<img
										src="/sayaratak-logo.svg"
										alt="Sayaratak"
										className="h-7 w-auto object-contain"
									/>
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col gap-6 py-6">
								{/* Navigation Links */}
								<nav className="flex flex-col gap-3">
									{navItems.map((item) => (
										<Link
											key={item.label}
											to={item.to}
											params={{ locale }}
											onClick={() => setMobileOpen(false)}
											className="flex items-center px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
										>
											{item.label}
										</Link>
									))}
								</nav>

								<hr className="border-border" />

								{/* Mobile Auth actions */}
								{user ? (
									<div className="flex flex-col gap-2">
										<div className="px-3 py-2">
											<p className="font-semibold text-sm">{user.name}</p>
											<p className="text-xs text-muted-foreground">{user.email}</p>
										</div>
										<Button
											variant="outline"
											className="w-full justify-start"
											asChild
											onClick={() => setMobileOpen(false)}
										>
											<Link to="/$locale/_dashboard/dashboard" params={{ locale }}>
												<LayoutDashboard className="size-4 me-2" />
												{t.common.dashboard}
											</Link>
										</Button>
										{user.role === "admin" && (
											<Button
												variant="secondary"
												className="w-full justify-start"
												asChild
												onClick={() => setMobileOpen(false)}
											>
												<Link to="/$locale/_admin/admin" params={{ locale }}>
													<ShieldAlert className="size-4 me-2" />
													{t.nav.adminPanel}
												</Link>
											</Button>
										)}
										<Button
											variant="destructive"
											className="w-full justify-start"
											onClick={() => {
												setMobileOpen(false);
												handleLogout();
											}}
										>
											<LogOut className="size-4 me-2" />
											{t.common.logout}
										</Button>
									</div>
								) : (
									<div className="flex flex-col gap-2">
										<Button asChild onClick={() => setMobileOpen(false)}>
											<Link to="/$locale/_auth/login" params={{ locale }}>
												{t.common.login}
											</Link>
										</Button>
									</div>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
