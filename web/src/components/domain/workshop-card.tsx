import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Workshop = {
	id: string;
	name: string;
	logoUrl: string;
	city: string;
	isVerified: boolean;
	rating: number;
	reviewCount: number;
	specializations: string[];
	isOpenNow: boolean;
	hoursText?: string;
};

export function WorkshopCard({
	workshop,
	className,
}: {
	workshop: Workshop;
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
				<div className="flex flex-col items-center text-center gap-3 mb-4">
					<div className="size-20 shrink-0 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center">
						{workshop.logoUrl ? (
							<img
								src={workshop.logoUrl}
								alt={workshop.name}
								className="size-full object-cover"
							/>
						) : (
							<Wrench className="size-8 text-muted-foreground" />
						)}
					</div>
					<div className="flex-1 w-full space-y-1.5">
						<div className="flex items-center justify-center gap-1">
							<h3 className="font-heading text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
								{workshop.name}
							</h3>
							{workshop.isVerified && (
								<BadgeCheck className="size-4 text-primary shrink-0" />
							)}
						</div>
						<div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
							<MapPin className="size-3 shrink-0" />
							<span className="truncate">{workshop.city}</span>
						</div>
						<div className="flex items-center justify-center gap-3 text-xs font-semibold">
							<div className="flex items-center gap-1 text-amber-500">
								<Star className="size-3.5 fill-amber-400 text-amber-400" />
								<span>{workshop.rating.toFixed(1)}</span>
								<span className="text-muted-foreground font-normal">
									({workshop.reviewCount}{" "}
									{locale === "ar" ? "تقييم" : "reviews"})
								</span>
							</div>
						</div>
						<div className="pt-1">
							{workshop.isOpenNow ? (
								<Badge
									variant="secondary"
									className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent text-[10px] font-bold px-2 py-0"
								>
									{locale === "ar" ? "مفتوح الآن" : "Open now"}
								</Badge>
							) : (
								<span className="text-[11px] font-semibold text-red-600 flex items-center">
									<span className="mr-1.5 text-xl leading-none">&bull;</span>
									{workshop.hoursText || (locale === "ar" ? "مغلق" : "Closed")}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Brands Tags */}
				<div className="flex flex-wrap justify-center gap-1.5 mb-5 mt-2">
					{workshop.specializations.map((spec) => (
						<Badge
							key={spec}
							variant="outline"
							className="text-[10px] font-medium bg-transparent text-slate-600 border-border/60"
						>
							{spec}
						</Badge>
					))}
				</div>

				<div className="mt-auto pt-2">
					{/* Action Button */}
					<Button
						variant="outline"
						className="w-full text-xs font-semibold h-9 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
						asChild
					>
						<Link to="/$locale" params={{ locale }}>
							{locale === "ar" ? "عرض المركز" : "View Workshop"}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
