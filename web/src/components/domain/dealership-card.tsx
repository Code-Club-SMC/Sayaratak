import { Link } from "@tanstack/react-router";
import {
	BadgeCheck,
	CalendarDays,
	Car,
	Clock,
	MapPin,
	ShieldCheck,
	Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Dealership = {
	id: string;
	name: string;
	logoUrl: string;
	city: string;
	isVerified: boolean;
	rating: number;
	reviewCount: number;
	inventoryCount: number;
	brands: string[];
	recentImages: string[];
	responseTime: string;
	yearsActive: string;
};

export function DealershipCard({
	dealership,
	className,
}: {
	dealership: Dealership;
	className?: string;
}) {
	const { t, locale } = useTranslation();

	return (
		<div
			className={cn(
				"group relative flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md",
				className,
			)}
		>
			<div className="p-5 flex flex-col h-full">
				{/* Header: Logo & Info */}
				<div className="flex items-start gap-4 mb-4">
					<div className="size-14 shrink-0 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center">
						{dealership.logoUrl ? (
							<img
								src={dealership.logoUrl}
								alt={dealership.name}
								className="size-full object-cover"
							/>
						) : (
							<span className="font-heading font-bold text-lg text-muted-foreground">
								{dealership.name.charAt(0)}
							</span>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1">
							<h3 className="font-heading text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
								{dealership.name}
							</h3>
							{dealership.isVerified && (
								<BadgeCheck className="size-4 text-primary shrink-0" />
							)}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
							<MapPin className="size-3 shrink-0" />
							<span className="truncate">{dealership.city}</span>
						</div>
						<div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
							<div className="flex items-center gap-1 text-foreground">
								<Star className="size-3.5 fill-amber-400 text-amber-400" />
								<span>{dealership.rating.toFixed(1)}</span>
								<span className="text-muted-foreground font-normal">
									({dealership.reviewCount}{" "}
									{locale === "ar" ? "تقييم" : "reviews"})
								</span>
							</div>
							<span className="text-border font-normal">|</span>
							<div className="flex items-center gap-1 text-muted-foreground font-normal">
								<Car className="size-3.5" />
								<span>
									{dealership.inventoryCount}{" "}
									{locale === "ar" ? "سيارة" : "cars"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Brands Tags */}
				<div className="flex flex-wrap gap-1.5 mb-4">
					{dealership.brands.map((brand) => (
						<Badge
							key={brand}
							variant="secondary"
							className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 shadow-none"
						>
							{brand}
						</Badge>
					))}
				</div>

				{/* Thumbnails Row */}
				{dealership.recentImages.length > 0 && (
					<div className="flex items-center gap-1.5 mb-5">
						{dealership.recentImages.map((img, idx) => (
							<div
								key={idx}
								className="h-12 flex-1 rounded-md overflow-hidden bg-muted"
							>
								<img src={img} alt="" className="size-full object-cover" />
							</div>
						))}
					</div>
				)}

				<div className="mt-auto space-y-4">
					{/* Features Row */}
					<div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium border-t border-border/50 pt-4">
						{dealership.isVerified && (
							<div className="flex items-center gap-1">
								<ShieldCheck className="size-3 shrink-0" />
								<span className="truncate">
									{locale === "ar" ? "معرض موثّق" : "Verified Dealer"}
								</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<Clock className="size-3 shrink-0" />
							<span className="truncate">{dealership.responseTime}</span>
						</div>
						<div className="flex items-center gap-1">
							<CalendarDays className="size-3 shrink-0" />
							<span className="truncate">{dealership.yearsActive}</span>
						</div>
					</div>

					{/* Action Button */}
					<Button
						variant="outline"
						className="w-full text-xs font-semibold h-9 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
						asChild
					>
						<Link
							to="/$locale/dealerships/$id"
							params={{ locale, id: dealership.id }}
						>
							{locale === "ar" ? "عرض المعرض" : "View Dealership"}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
