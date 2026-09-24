import { Link, useNavigate } from "@tanstack/react-router";
import {
	Bell,
	ChevronDown,
	LayoutDashboard,
	LogOut,
	Menu,
	Plus,
	ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

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
			to: "/$locale",
			params: { locale },
		});
	}

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border bg-background">
			<div className="container mx-auto flex h-[72px] items-center justify-between px-4 sm:px-6">
				{/* Brand Logo & Desktop Nav */}
				<div className="flex items-center gap-6 lg:gap-10">
					<Link
						to="/$locale"
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
					<nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
						<DropdownMenu>
							<DropdownMenuTrigger className="flex items-center gap-1.5 text-foreground hover:text-primary outline-none">
								Buy <ChevronDown className="size-4 text-muted-foreground" />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem asChild>
									<Link to="/$locale/listings" params={{ locale }}>
										Used Cars
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/$locale/listings" params={{ locale }}>
										New Cars
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger className="flex items-center gap-1.5 text-foreground hover:text-primary outline-none">
								Rent <ChevronDown className="size-4 text-muted-foreground" />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem asChild>
									<Link to="/$locale/listings" params={{ locale }}>
										Daily Rental
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/$locale/listings" params={{ locale }}>
										Monthly Rental
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<Link
							to="/$locale/dealerships"
							params={{ locale }}
							className="text-foreground hover:text-primary"
						>
							Dealerships
						</Link>
						<Link
							to="/$locale/workshops"
							params={{ locale }}
							className="text-foreground hover:text-primary"
						>
							Workshops
						</Link>
						<Link
							to="/$locale/listings"
							params={{ locale }}
							className="text-foreground hover:text-primary"
						>
							Spare Parts
						</Link>

						<Link
							to="/$locale/mechanics"
							params={{ locale }}
							className="text-foreground hover:text-primary"
						>
							Mechanics
						</Link>
						<Link
							to="/$locale"
							params={{ locale }}
							className="text-foreground hover:text-primary"
						>
							Pricing
						</Link>
					</nav>
				</div>

				{/* Header Actions (End Side) */}
				<div className="flex items-center gap-4">
					{/* Post Ad CTA Button */}
					<Button
						className="gap-2 font-semibold bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 hidden md:flex"
						asChild
					>
						<Link
							to={user ? "/$locale/dashboard/listings/new" : "/$locale/login"}
							params={{ locale }}
						>
							<Plus className="size-4" />
							<span>Post an Ad</span>
						</Link>
					</Button>

					{/* Desktop User Avatar / Auth */}
					<div className="hidden lg:flex items-center">
						{user ? (
							<div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
								<Button variant="ghost" size="icon" className="relative">
									<Bell className="size-5 text-slate-600" />
									<span className="absolute top-1.5 right-1.5 size-2 bg-blue-600 rounded-full border-2 border-white"></span>
								</Button>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="flex items-center gap-2 outline-none"
										>
											<Avatar className="size-8 border border-border">
												<AvatarImage src={user.image || undefined} />
												<AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-semibold">
													{user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<ChevronDown className="size-4 text-slate-500" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<div className="px-2 py-1.5">
											<p className="font-semibold text-sm">{user.name}</p>
											<p className="text-xs text-muted-foreground">
												{user.email}
											</p>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link to="/$locale/dashboard" params={{ locale }}>
												Dashboard
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleLogout}
											className="text-red-600 focus:bg-red-50 focus:text-red-700"
										>
											Log out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						) : (
							<Button asChild className="ml-4">
								<Link to="/$locale/login" params={{ locale }}>
									Login
								</Link>
							</Button>
						)}
					</div>

					{/* Mobile Menu Hamburger */}
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-foreground lg:hidden"
								aria-label="Open menu"
							>
								<Menu className="size-6" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side={dir === "rtl" ? "right" : "left"}
							className="w-72 sm:w-80"
						>
							<SheetHeader className="text-start pb-4 border-b border-border">
								<SheetTitle>
									<img
										src="/sayaratak-logo.svg"
										alt="Sayaratak"
										className="h-7 w-auto object-contain"
									/>
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col gap-6 py-6 overflow-y-auto">
								{/* Navigation Links */}
								<nav className="flex flex-col gap-3">
									<Link
										to="/$locale/listings"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Buy
									</Link>
									<Link
										to="/$locale/listings"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Rent
									</Link>
									<Link
										to="/$locale/dealerships"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Dealerships
									</Link>
									<Link
										to="/$locale/workshops"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Workshops
									</Link>
									<Link
										to="/$locale/mechanics"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Mechanics
									</Link>
									<Link
										to="/$locale/listings"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Spare Parts
									</Link>
									<Link
										to="/$locale"
										params={{ locale }}
										onClick={() => setMobileOpen(false)}
										className="px-3 py-2 text-base font-medium"
									>
										Pricing
									</Link>
								</nav>

								<hr className="border-border" />

								{/* Mobile Auth actions */}
								{user ? (
									<div className="flex flex-col gap-2">
										<div className="px-3 py-2">
											<p className="font-semibold text-sm">{user.name}</p>
											<p className="text-xs text-muted-foreground">
												{user.email}
											</p>
										</div>
										<Button
											variant="outline"
											className="w-full justify-start"
											asChild
											onClick={() => setMobileOpen(false)}
										>
											<Link to="/$locale/dashboard" params={{ locale }}>
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
												<Link to="/$locale/admin" params={{ locale }}>
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
											<Link to="/$locale/login" params={{ locale }}>
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
