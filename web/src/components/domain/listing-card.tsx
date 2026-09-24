import { Link } from "@tanstack/react-router";
import {
	Calendar,
	Camera,
	CheckCircle2,
	Gauge,
	Heart,
	MapPin,
	Settings2,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiDelete, apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ListingCardData = {
	id: string;
	title: string;
	trim?: string | null;
	price: number;
	currency?: string;
	year?: number | null;
	mileage?: number | null;
	transmission?: string | null;
	fuelType?: string | null;
	condition?: string | null;
	city?: string | null;
	district?: string | null;
	distanceKm?: number | null;
	images?: string[];
	isFeatured?: boolean;
	isNew?: boolean;
	isFavorited?: boolean;
	seller?: {
		name: string;
		isVerified?: boolean;
		accountType?: "dealership" | "workshop" | "mechanic" | "user";
	} | null;
};

type ListingCardProps = {
	listing: ListingCardData;
	variant?: "grid" | "compact" | "horizontal";
	className?: string;
	onFavoriteChange?: (id: string, favorited: boolean) => void;
};

/**
 * Format price in SDG (or configured currency) with comma separation
 * using tabular numbers for visual stability.
 */
export function formatCurrency(
	amount: number,
	currency: string = "SDG",
): string {
	return `${currency} ${amount.toLocaleString()}`;
}

export function ListingCard({
	listing,
	variant = "grid",
	className,
	onFavoriteChange,
}: ListingCardProps) {
	const { t, locale, dir } = useTranslation();
	const [favorited, setFavorited] = useState(Boolean(listing.isFavorited));
	const [favLoading, setFavLoading] = useState(false);
	const [imgError, setImgError] = useState(false);

	const imageSrc =
		listing.images && listing.images.length > 0 && !imgError
			? listing.images[0]
			: "/images/placeholders/car-placeholder.svg";

	const photoCount = listing.images ? listing.images.length : 0;

	async function toggleFavorite(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (favLoading) return;
		setFavLoading(true);

		const nextState = !favorited;
		setFavorited(nextState);

		try {
			if (nextState) {
				await apiPost(`/api/v1/favorites/${listing.id}`);
			} else {
				await apiDelete(`/api/v1/favorites/${listing.id}`);
			}
			onFavoriteChange?.(listing.id, nextState);
		} catch {
			// Rollback on error
			setFavorited(!nextState);
		} finally {
			setFavLoading(false);
		}
	}

	const locationText = [listing.city, listing.district]
		.filter(Boolean)
		.join(", ");

	function renderSellerBadge() {
		if (listing.seller?.isVerified) {
			return (
				<div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
					<CheckCircle2 className="size-[11px] shrink-0" />
					<span>{locale === "ar" ? "بائع موثوق" : "Verified Seller"}</span>
				</div>
			);
		}
		if (listing.seller?.accountType === "dealership") {
			return (
				<div className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
					<ShieldCheck className="size-[11px] shrink-0" />
					<span>{locale === "ar" ? "معرض" : "Dealer"}</span>
				</div>
			);
		}
		if (listing.seller?.accountType === "workshop") {
			return (
				<div className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
					<ShieldCheck className="size-[11px] shrink-0" />
					<span>{locale === "ar" ? "ورشة" : "Shop"}</span>
				</div>
			);
		}
		return (
			<div className="flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
				<span>{locale === "ar" ? "فرد" : "Individual"}</span>
			</div>
		);
	}

	// Specs array: Year, Mileage, Transmission
	const specs: string[] = [];
	if (listing.year) specs.push(String(listing.year));
	if (listing.mileage !== undefined && listing.mileage !== null) {
		specs.push(`${listing.mileage.toLocaleString()} ${t.listing.km}`);
	}
	if (listing.transmission) {
		const trans =
			listing.transmission.toLowerCase() === "automatic"
				? t.listing.automatic
				: t.listing.manual;
		specs.push(trans);
	}

	// ── Horizontal / Compact variant (for list view, map sidebar) ──────
	if (variant === "horizontal") {
		return (
			<div
				className={cn(
					"group relative flex overflow-hidden rounded-lg border border-border bg-card transition-all duration-150 hover:border-primary/40 hover:shadow-sm",
					className,
				)}
			>
				<Link
					to="/$locale/listings/$id"
					params={{ locale, id: listing.id }}
					className="flex w-full flex-col sm:flex-row"
				>
					{/* Thumbnail container */}
					<div className="relative aspect-[4/3] w-full sm:w-48 md:w-56 shrink-0 overflow-hidden bg-muted">
						<img
							src={imageSrc}
							alt={listing.title}
							onError={() => setImgError(true)}
							className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
							loading="lazy"
						/>
						{listing.isFeatured && (
							<Badge className="absolute top-2.5 start-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
								{t.listing.featured}
							</Badge>
						)}
					</div>

					{/* Content */}
					<div className="flex flex-1 flex-col justify-between p-4">
						<div>
							<div className="flex items-start justify-between gap-2">
								<div>
									<h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
										{listing.title}
									</h3>
									{listing.trim && (
										<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
											{listing.trim}
										</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={toggleFavorite}
									className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
									aria-label={t.listing.addToFavorites}
								>
									<Heart
										className={cn(
											"size-4 transition-colors",
											favorited && "fill-rose-500 text-rose-500",
										)}
									/>
								</Button>
							</div>

							{/* Quick Specs Line */}
							<div className="mt-2.5 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
								{listing.year && (
									<div className="flex items-center gap-1">
										<Calendar className="size-3.5" />
										<span className="tabular-nums">{listing.year}</span>
									</div>
								)}
								{listing.mileage !== undefined && listing.mileage !== null && (
									<div className="flex items-center gap-1">
										<Gauge className="size-3.5" />
										<span className="tabular-nums">
											{listing.mileage.toLocaleString()} {t.listing.km}
										</span>
									</div>
								)}
								{listing.transmission && (
									<div className="flex items-center gap-1">
										<Settings2 className="size-3.5" />
										<span>
											{listing.transmission.toLowerCase() === "automatic"
												? t.listing.automatic
												: t.listing.manual}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Bottom: Price + Seller/Location */}
						<div className="mt-3">
							<div className="font-heading text-lg font-bold text-slate-800 tabular-nums">
								{formatCurrency(listing.price, listing.currency)}
							</div>

							<div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
								<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
									<MapPin className="size-3.5 text-blue-600 shrink-0" />
									<span className="truncate max-w-[120px]">
										{locationText || "Khartoum"}
									</span>
								</div>

								{renderSellerBadge()}
							</div>
						</div>
					</div>
				</Link>
			</div>
		);
	}

	// ── Standard Grid Card variant (default) ──────────────────────────
	return (
		<div
			className={cn(
				"group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-150 hover:border-primary/40 hover:shadow-sm",
				className,
			)}
		>
			<Link
				to="/$locale/listings/$id"
				params={{ locale, id: listing.id }}
				className="flex h-full flex-col"
			>
				{/* Image Container with 4:3 Aspect Ratio */}
				<div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
					<img
						src={imageSrc}
						alt={listing.title}
						onError={() => setImgError(true)}
						className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
						loading="lazy"
					/>

					{/* Badges on Image (Top-Start) */}
					<div className="absolute top-2.5 start-2.5 flex flex-col gap-1">
						{listing.isFeatured && (
							<Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
								{t.listing.featured}
							</Badge>
						)}
						{listing.isNew && !listing.isFeatured && (
							<Badge className="bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
								{t.listing.newListing}
							</Badge>
						)}
					</div>

					{/* Favorite Heart Button (Top-End) */}
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleFavorite}
						className="absolute top-2.5 end-2.5 size-8 rounded-full bg-black/40 text-white backdrop-blur-sm transition-transform hover:bg-black/60 hover:text-white active:scale-95"
						aria-label={t.listing.addToFavorites}
					>
						<Heart
							className={cn(
								"size-4 transition-colors",
								favorited && "fill-rose-500 text-rose-500",
							)}
						/>
					</Button>

					{/* Photo Count Badge (Bottom-End) */}
					{photoCount > 1 && (
						<div className="absolute bottom-2 end-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
							<Camera className="size-3" />
							<span>{photoCount}</span>
						</div>
					)}
				</div>

				{/* Card Body */}
				<div className="flex flex-1 flex-col justify-between p-4">
					<div>
						{/* Title */}
						<h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
							{listing.title}
						</h3>

						{/* Subtitle / Trim */}
						{listing.trim && (
							<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
								{listing.trim}
							</p>
						)}

						{/* Quick Specs Line */}
						<div className="mt-2.5 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
							{listing.year && (
								<div className="flex items-center gap-1">
									<Calendar className="size-3.5" />
									<span className="tabular-nums">{listing.year}</span>
								</div>
							)}
							{listing.mileage !== undefined && listing.mileage !== null && (
								<div className="flex items-center gap-1">
									<Gauge className="size-3.5" />
									<span className="tabular-nums">
										{listing.mileage.toLocaleString()} {t.listing.km}
									</span>
								</div>
							)}
							{listing.transmission && (
								<div className="flex items-center gap-1">
									<Settings2 className="size-3.5" />
									<span>
										{listing.transmission.toLowerCase() === "automatic"
											? t.listing.automatic
											: t.listing.manual}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Card Footer: Price & Location / Seller Badge */}
					<div className="mt-3.5">
						<div className="font-heading text-[15px] sm:text-base font-bold text-slate-800 tabular-nums">
							{formatCurrency(listing.price, listing.currency)}
						</div>

						<div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
							<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
								<MapPin className="size-3.5 text-blue-600 shrink-0" />
								<span className="truncate max-w-[120px]">
									{locationText || "Khartoum"}
								</span>
							</div>

							{renderSellerBadge()}
						</div>
					</div>
				</div>
			</Link>
		</div>
	);
}
