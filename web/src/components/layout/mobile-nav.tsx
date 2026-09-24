import { Link } from "@tanstack/react-router";
import { Car, Home, MessageSquare, PlusCircle, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type MobileNavProps = {
	isAuthenticated?: boolean;
};

export function MobileNav({ isAuthenticated = false }: MobileNavProps) {
	const { t, locale } = useTranslation();

	const accountTarget = isAuthenticated
		? ("/$locale/dashboard" as const)
		: ("/$locale/login" as const);

	const postAdTarget = isAuthenticated
		? ("/$locale/dashboard/listings/new" as const)
		: ("/$locale/login" as const);

	return (
		<nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
			<div className="flex h-16 items-center justify-around px-2">
				{/* Home */}
				<Link
					to="/$locale"
					params={{ locale }}
					className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
					activeProps={{ className: "text-primary font-semibold" }}
				>
					<Home className="size-5" />
					<span>{t.common.home}</span>
				</Link>

				{/* Browse Cars */}
				<Link
					to="/$locale/listings"
					params={{ locale }}
					className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
					activeProps={{ className: "text-primary font-semibold" }}
				>
					<Car className="size-5" />
					<span>{t.common.cars}</span>
				</Link>

				{/* Post Ad (Center CTA) */}
				<Link
					to={postAdTarget}
					params={{ locale }}
					className="flex flex-col items-center justify-center gap-1 -mt-4"
				>
					<div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95">
						<PlusCircle className="size-6" />
					</div>
					<span className="text-[10px] font-semibold text-primary">
						{t.nav.postAd}
					</span>
				</Link>

				{/* Messages */}
				<Link
					to={accountTarget}
					params={{ locale }}
					className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
					activeProps={{ className: "text-primary font-semibold" }}
				>
					<MessageSquare className="size-5" />
					<span>{t.nav.messages}</span>
				</Link>

				{/* Account */}
				<Link
					to={accountTarget}
					params={{ locale }}
					className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
					activeProps={{ className: "text-primary font-semibold" }}
				>
					<User className="size-5" />
					<span>{isAuthenticated ? t.common.dashboard : t.common.login}</span>
				</Link>
			</div>
		</nav>
	);
}
