import { Link } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Mechanic = {
	id: string;
	name: string;
	photoUrl: string;
	title: string;
	experience: string;
	city: string;
	isVerified: boolean;
	rating: number;
	reviewCount: number;
	specializations: string[];
	isAvailable: boolean;
};

export function MechanicCard({
	mechanic,
	className,
}: {
	mechanic: Mechanic;
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
				{/* Header: Photo & Info */}
				<div className="flex items-start gap-4 mb-4">
					<div className="w-20 h-24 shrink-0 rounded-lg border border-border bg-muted overflow-hidden">
						{mechanic.photoUrl ? (
							<img
								src={mechanic.photoUrl}
								alt={mechanic.name}
								className="size-full object-cover object-top"
							/>
						) : (
							<div className="size-full flex items-center justify-center bg-slate-100 text-slate-400">
								<Briefcase className="size-8" />
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
						<div className="flex items-center gap-1">
							<h3 className="font-heading text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
								{mechanic.name}
							</h3>
							{mechanic.isVerified && (
								<BadgeCheck className="size-4 text-primary shrink-0" />
							)}
						</div>

						<p className="text-xs font-medium text-slate-700 truncate">
							{mechanic.title}
						</p>

						<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<Briefcase className="size-3 shrink-0" />
							<span className="truncate">{mechanic.experience}</span>
						</div>

						<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<MapPin className="size-3 shrink-0" />
							<span className="truncate">{mechanic.city}</span>
						</div>

						<div className="flex items-center gap-1 text-xs font-semibold pt-0.5">
							<Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
							<span className="text-amber-500">
								{mechanic.rating.toFixed(1)}
							</span>
							<span className="text-muted-foreground font-normal">
								({mechanic.reviewCount} {locale === "ar" ? "تقييم" : "reviews"})
							</span>
						</div>

						<div className="pt-0.5">
							{mechanic.isAvailable ? (
								<Badge
									variant="secondary"
									className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent text-[10px] font-bold px-2 py-0"
								>
									{locale === "ar" ? "متاح" : "Available"}
								</Badge>
							) : (
								<Badge
									variant="secondary"
									className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent text-[10px] font-bold px-2 py-0"
								>
									{locale === "ar" ? "مشغول" : "Busy"}
								</Badge>
							)}
						</div>
					</div>
				</div>

				{/* Brands Tags */}
				<div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
					{mechanic.specializations.map((spec) => (
						<Badge
							key={spec}
							variant="outline"
							className="text-[10px] font-medium bg-transparent text-slate-600 border-border/60"
						>
							{spec}
						</Badge>
					))}
				</div>

				<div className="mt-auto">
					{/* Action Button */}
					<Button
						variant="outline"
						className="w-full text-xs font-semibold h-9 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
						asChild
					>
						<Link to="/$locale" params={{ locale }}>
							{locale === "ar" ? "عرض الملف" : "View Profile"}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
