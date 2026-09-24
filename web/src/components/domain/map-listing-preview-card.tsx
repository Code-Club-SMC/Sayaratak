import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Cog,
	Fuel,
	Gauge,
	Heart,
	MapPin,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { ListingItem } from "@/lib/query-options/listings";

type MapListingPreviewCardProps = {
	listing: ListingItem;
	onClose: () => void;
	distanceKm?: number;
	className?: string;
};

export function MapListingPreviewCard({
	listing,
	onClose,
	distanceKm = 2.1,
	className,
}: MapListingPreviewCardProps) {
	const { locale, dir } = useTranslation();
	const [isFavorited, setIsFavorited] = useState(Boolean(listing.isFavorited));

	const image =
		listing.images?.[0] ||
		"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80";

	return (
		<div
			className={`relative flex flex-col sm:flex-row items-stretch gap-4 p-4 rounded-2xl bg-card border border-border shadow-2xl z-30 max-w-lg w-full transition-all animate-in fade-in zoom-in-95 duration-200 ${
				className ?? ""
			}`}
		>
			{/* Top Action Icons: Favorite & Close */}
			<div className="absolute top-3 end-3 flex items-center gap-1 z-10">
				<button
					type="button"
					onClick={() => setIsFavorited(!isFavorited)}
					className="size-8 rounded-full bg-card/80 hover:bg-card backdrop-blur-md flex items-center justify-center text-foreground hover:text-rose-500 transition-colors shadow-xs"
					aria-label="Save listing"
				>
					<Heart
						className={`size-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`}
					/>
				</button>
				<button
					type="button"
					onClick={onClose}
					className="size-8 rounded-full bg-card/80 hover:bg-card backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-xs"
					aria-label="Close preview"
				>
					<X className="size-4" />
				</button>
			</div>

			{/* Left: Vehicle Image */}
			<div className="sm:w-44 h-40 sm:h-auto rounded-xl overflow-hidden shrink-0 relative bg-muted">
				<img
					src={image}
					alt={listing.title}
					className="size-full object-cover"
				/>
			</div>

			{/* Right: Info & CTA */}
			<div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
				<div>
					<h3 className="font-heading text-base font-bold text-foreground truncate pe-16">
						{listing.title}
					</h3>
					<div className="text-base sm:text-lg font-black text-primary tabular-nums mt-0.5">
						{listing.currency || "SDG"} {listing.price.toLocaleString()}
					</div>

					{/* Location & Distance */}
					<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
						<MapPin className="size-3.5 text-primary shrink-0" />
						<span className="truncate">
							{listing.city || "Khartoum"}
							{listing.district ? `, ${listing.district}` : ""}
						</span>
						<span>•</span>
						<span className="font-medium text-foreground">
							{distanceKm} {locale === "ar" ? "كم" : "km away"}
						</span>
					</div>

					{/* 4 Attributes Strip */}
					<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2.5 flex-wrap">
						<div className="flex items-center gap-1">
							<Calendar className="size-3 text-primary" />
							<span>{listing.year || 2020}</span>
						</div>
						<div className="flex items-center gap-1">
							<Gauge className="size-3 text-primary" />
							<span>{listing.mileage?.toLocaleString() || "60,000"} km</span>
						</div>
						<div className="flex items-center gap-1">
							<Cog className="size-3 text-primary" />
							<span>{listing.transmission || "Automatic"}</span>
						</div>
						<div className="flex items-center gap-1">
							<Fuel className="size-3 text-primary" />
							<span>{listing.fuelType || "Petrol"}</span>
						</div>
					</div>
				</div>

				{/* Footer: Seller & View Details */}
				<div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
					<div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
						<CheckCircle2 className="size-3.5" />
						<span className="truncate max-w-[120px]">
							{listing.seller?.name || "Al Fajer Motors"}
						</span>
					</div>

					<Link to="/$locale/listings/$id" params={{ locale, id: listing.id }}>
						<Button
							size="sm"
							className="h-8 px-3 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90"
						>
							<span>{locale === "ar" ? "عرض التفاصيل" : "View Details"}</span>
							{dir === "rtl" ? (
								<ArrowLeft className="size-3.5" />
							) : (
								<ArrowRight className="size-3.5" />
							)}
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
