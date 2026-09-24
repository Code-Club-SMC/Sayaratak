import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Calendar,
	Car,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Cog,
	Flag,
	Fuel,
	Gauge,
	Heart,
	Images,
	MapPin,
	MessageCircle,
	MessageSquare,
	Phone,
	PhoneCall,
	Share2,
	ShieldCheck,
	Sparkles,
	Star,
} from "lucide-react";
import { useState } from "react";
import { GalleryLightbox } from "@/components/domain/gallery-lightbox";
import { ListingCard } from "@/components/domain/listing-card";
import { ReportDialog } from "@/components/domain/report-dialog";
import { ShareSheet } from "@/components/domain/share-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
	listingDetailQueryOptions,
	MOCK_SEARCH_LISTINGS,
} from "@/lib/query-options/listings";

export const Route = createFileRoute("/$locale/_public/listings/$id")({
	loader: ({ context, params }) => {
		return context.queryClient.ensureQueryData(
			listingDetailQueryOptions(params.locale, params.id),
		);
	},
	component: ListingDetailPage,
});

function ListingDetailPage() {
	const { locale, t, dir } = useTranslation();
	const { id } = Route.useParams();
	const navigate = useNavigate();

	// Modal states
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [shareSheetOpen, setShareSheetOpen] = useState(false);
	const [reportDialogOpen, setReportDialogOpen] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);
	const [_phoneRevealed, setPhoneRevealed] = useState(false);

	const { data: listing, isLoading } = useQuery(
		listingDetailQueryOptions(locale, id),
	);

	if (isLoading || !listing) {
		return (
			<div className="min-h-screen flex items-center justify-center p-8 bg-background">
				<div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const images =
		listing.images && listing.images.length > 0
			? listing.images
			: [
					"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=85",
					"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
					"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
					"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
					"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
				];
	const sellerPhone = listing.seller?.phone;
	const sellerWhatsapp = listing.seller?.whatsapp || sellerPhone;

	// Click analytics trackers
	function trackClick(type: "phone" | "whatsapp") {
		apiPost(`/api/v1/listings/${id}/clicks`, { type }).catch(() => {});
	}

	function _handlePhoneReveal() {
		setPhoneRevealed(true);
		trackClick("phone");
	}

	function handleWhatsApp() {
		if (!sellerWhatsapp) return;
		trackClick("whatsapp");
		const text = encodeURIComponent(
			`Hello, I'm interested in your listing: ${listing?.title} on Sayaratak.`,
		);
		window.open(
			`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, "")}?text=${text}`,
			"_blank",
		);
	}

	function handleCall() {
		if (!sellerPhone) return;
		trackClick("phone");
		window.location.href = `tel:${sellerPhone.replace(/[^0-9+]/g, "")}`;
	}

	const relatedListings = MOCK_SEARCH_LISTINGS.filter((l) => l.id !== id).slice(
		0,
		4,
	);

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
			{/* Breadcrumb Bar */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto max-w-7xl px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
					<Link
						to="/$locale"
						params={{ locale }}
						className="hover:text-foreground"
					>
						{t.common.home}
					</Link>
					<span>/</span>
					<Link
						to="/$locale/listings"
						params={{ locale }}
						className="hover:text-foreground"
					>
						{t.search.buy}
					</Link>
					<span>/</span>
					<Link
						to="/$locale/listings"
						params={{ locale }}
						search={{ categoryId: "cat-cars" }}
						className="hover:text-foreground"
					>
						{locale === "ar" ? "سيارات للبيع" : "Cars for Sale"}
					</Link>
					<span>/</span>
					<span className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
						{listing.title}
					</span>
				</div>
			</div>

			<div className="container mx-auto max-w-7xl px-4 py-6 space-y-8">
				{/* 1. Photo Gallery (Matching SCR-011) */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-2">
					{/* Featured Large Image (Left 2 cols on desktop) */}
					<button
						type="button"
						className="md:col-span-2 relative aspect-16/10 md:aspect-auto md:h-[480px] rounded-2xl overflow-hidden cursor-pointer group"
						onClick={() => {
							setSelectedImageIndex(0);
							setLightboxOpen(true);
						}}
					>
						<img
							src={images[0]}
							alt={`${listing.title} main`}
							className="size-full object-cover group-hover:scale-102 transition-transform duration-300"
						/>
						{/* Photo count indicator */}
						<div className="absolute bottom-4 start-4 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[13px] font-semibold flex items-center gap-1.5">
							<Images className="size-4" />
							<span>1 / {images.length}</span>
						</div>
					</button>

					{/* 4 Secondary Images + Button (Right 1 col on desktop) */}
					<div className="hidden md:flex flex-col gap-2 h-[480px]">
						<div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
							{images.slice(1, 5).map((img, idx) => {
								const imageIdx = idx + 1;
								return (
									<button
										type="button"
										key={img}
										className="relative rounded-xl overflow-hidden cursor-pointer group"
										onClick={() => {
											setSelectedImageIndex(imageIdx);
											setLightboxOpen(true);
										}}
									>
										<img
											src={img}
											alt={`${listing.title} ${imageIdx + 1}`}
											className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									</button>
								);
							})}
						</div>
						<button
							type="button"
							onClick={() => {
								setSelectedImageIndex(0);
								setLightboxOpen(true);
							}}
							className="w-full h-12 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm shrink-0"
						>
							<Images className="size-4" />
							<span>
								{locale === "ar" ? "عرض جميع الصور" : "View all photos"}
							</span>
						</button>
					</div>
				</section>

				{/* 2. Main Two-Column Layout: Vehicle Details + Sidebar */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left: Main Content (2 cols) */}
					<div className="lg:col-span-2 space-y-6">
						{/* Title, Badges, Location & Action Buttons */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-2">
								<h1 className="font-heading text-[22px] sm:text-[28px] font-bold text-slate-900 leading-tight">
									{listing.title}
								</h1>
								<div className="flex items-center gap-2.5 flex-wrap text-xs font-semibold">
									<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 px-2 py-0.5 rounded">
										{locale === "ar" ? "متاح" : "Available"}
									</Badge>
									<div className="flex items-center gap-1 text-slate-500 font-medium">
										<MapPin className="size-4 text-slate-400 shrink-0" />
										<span>
											{listing.city || "Khartoum"}
											{listing.district ? `, ${listing.district}` : ""}
										</span>
									</div>
								</div>
							</div>

							{/* Actions: Save / Share / Report */}
							<div className="flex items-center gap-1 shrink-0 text-slate-600">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsFavorited(!isFavorited)}
									className={`h-9 text-[13px] font-medium gap-1.5 px-3 ${
										isFavorited
											? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
											: "hover:text-slate-900 hover:bg-slate-100"
									}`}
								>
									<Heart
										className={`size-4 ${isFavorited ? "fill-rose-600 text-rose-600" : ""}`}
									/>
									<span>
										{isFavorited
											? locale === "ar"
												? "محفوظ"
												: "Saved"
											: t.listing.addToFavorites || "Save"}
									</span>
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShareSheetOpen(true)}
									className="h-9 text-[13px] font-medium gap-1.5 px-3 hover:text-slate-900 hover:bg-slate-100"
								>
									<Share2 className="size-4" />
									<span>{locale === "ar" ? "مشاركة" : "Share"}</span>
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => setReportDialogOpen(true)}
									className="h-9 text-[13px] font-medium gap-1.5 px-3 hover:text-destructive hover:bg-red-50"
								>
									<Flag className="size-4" />
									<span>{locale === "ar" ? "إبلاغ" : "Report"}</span>
								</Button>
							</div>
						</div>

						<div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
							{/* Price Block */}
							<div className="flex flex-col items-start pb-6 border-b border-slate-100">
								<div className="flex items-center gap-3">
									<span className="text-[32px] leading-none font-black text-blue-600 tabular-nums">
										{listing.currency || "SDG"} {listing.price.toLocaleString()}
									</span>
									{listing.isFeatured && (
										<Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold gap-1 mt-1">
											<Sparkles className="size-3" />
											{t.listing.featured || "Featured"}
										</Badge>
									)}
								</div>
								<span className="text-[13px] text-blue-600 mt-2 font-bold">
									{locale === "ar" ? "قابل للتفاوض" : "Negotiable"}
								</span>
							</div>

							{/* Key Attributes 6-Pill Row (Matching SCR-011) */}
							<div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-100">
								<div className="flex items-start gap-2.5">
									<Calendar className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 tabular-nums leading-none mb-1">
											{listing.year || "2020"}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{t.listing.year || "Year"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2.5">
									<Gauge className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 tabular-nums leading-none mb-1">
											{listing.mileage
												? `${listing.mileage.toLocaleString()} ${t.listing.km || "km"}`
												: `60,000 ${t.listing.km || "km"}`}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{t.listing.mileage || "Mileage"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
											{listing.condition === "new"
												? t.listing.newListing || "New"
												: t.listing.used || "Used"}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{t.listing.condition || "Condition"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2.5">
									<Cog className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
											{listing.transmission === "manual"
												? t.listing.manual || "Manual"
												: t.listing.automatic || "Automatic"}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{t.listing.transmission || "Transmission"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2.5">
									<Fuel className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
											{listing.fuelType || t.listing.petrol || "Petrol"}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{t.listing.fuelType || "Fuel Type"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-2.5">
									<Car className="size-5 text-slate-500 mt-0.5" />
									<div>
										<p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
											{listing.vehicleType?.toUpperCase() || "SUV"}
										</p>
										<p className="text-[11px] text-slate-500 font-medium leading-none">
											{locale === "ar" ? "الهيكل" : "Body Type"}
										</p>
									</div>
								</div>
							</div>

							{/* Description Section */}
							<div className="space-y-3 pb-6 border-b border-slate-100">
								<h3 className="font-heading text-lg font-bold text-slate-900">
									{locale === "ar" ? "الوصف" : "Description"}
								</h3>
								<p className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-line font-medium">
									{listing.description ||
										"Immaculate Toyota Land Cruiser 2020 VX.R 4.0L in excellent condition. Full service history at Toyota authorized dealer.\nAccident free, single owner, and well maintained. Comes with premium leather interior, sunroof, rear entertainment, and 8 airbags. Ready to drive."}
								</p>
							</div>

							{/* Specifications 3-Column Table (Matching SCR-011) */}
							<div className="space-y-4">
								<h3 className="font-heading text-lg font-bold text-slate-900">
									{locale === "ar" ? "المواصفات الفنية" : "Specifications"}
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-[13px]">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.year || "Year"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.year}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.make || "Make"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.make}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.model || "Model"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.model}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "الفئة" : "Trim"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.trim || "VX.R 4.0L"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.mileage || "Mileage"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.mileage
													? `${listing.mileage.toLocaleString()} ${t.listing.km || "km"}`
													: "-"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.condition || "Condition"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.condition === "new"
													? t.listing.newListing || "New"
													: t.listing.used || "Used"}
											</span>
										</div>
									</div>

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.transmission || "Transmission"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.transmission === "manual"
													? t.listing.manual || "Manual"
													: t.listing.automatic || "Automatic"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{t.listing.fuelType || "Fuel Type"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.fuelType || t.listing.petrol || "Petrol"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "الهيكل" : "Body Type"}
											</span>
											<span className="font-bold text-slate-900">
												{listing.vehicleType?.toUpperCase() || "SUV"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "الدفع" : "Drivetrain"}
											</span>
											<span className="font-bold text-slate-900">4WD</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "حجم المحرك" : "Engine Size"}
											</span>
											<span className="font-bold text-slate-900">4.0L V6</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "اللون الخارجي" : "Exterior Color"}
											</span>
											<span className="font-bold text-slate-900">
												{locale === "ar" ? "أبيض لؤلؤي" : "White Pearl"}
											</span>
										</div>
									</div>

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "اللون الداخلي" : "Interior Color"}
											</span>
											<span className="font-bold text-slate-900">
												{locale === "ar" ? "بيج" : "Beige"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "حالة رقم الشاصي" : "VIN Status"}
											</span>
											<span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
												{locale === "ar" ? "موثق" : "Verified"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "مدينة التسجيل" : "Registered City"}
											</span>
											<span className="font-bold text-slate-900">
												{locale === "ar" ? "الخرطوم" : "Khartoum"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "تاريخ الصيانة" : "Service History"}
											</span>
											<span className="font-bold text-slate-900">
												{locale === "ar" ? "سجل كامل" : "Full Service History"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "تاريخ النشر" : "Posted On"}
											</span>
											<span className="font-bold text-slate-900">
												May 24, 2025
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-slate-500 font-medium">
												{locale === "ar" ? "رقم الإعلان" : "Listing ID"}
											</span>
											<span className="font-bold text-slate-900">
												STK-2025-0524-00178
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Verified Seller Profile Card (Matching SCR-011) */}
						<div className="p-6 rounded-2xl border border-border bg-card space-y-4">
							<div className="flex items-start gap-4">
								<div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xl shrink-0">
									{listing.seller?.name?.charAt(0) || "A"}
								</div>
								<div className="space-y-1 flex-1">
									<div className="flex items-center gap-2 flex-wrap">
										<h4 className="font-heading text-base font-bold text-foreground">
											{listing.seller?.name ||
												(locale === "ar" ? "البائع" : "Seller")}
										</h4>
										{listing.seller?.isVerified && (
											<Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold gap-1">
												<CheckCircle2 className="size-3" />
												{locale === "ar" ? "بائع موثّق" : "Verified Seller"}
											</Badge>
										)}
									</div>
									{listing.seller?.rating ? (
										<div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
											<div className="flex items-center">
												{[1, 2, 3, 4, 5].map((star) => (
													<Star
														key={star}
														className="size-3.5 fill-amber-400 text-amber-400"
													/>
												))}
											</div>
											<span className="text-foreground ms-1">
												{listing.seller.rating}
											</span>
											{listing.seller.reviewCount ? (
												<span className="text-muted-foreground font-normal">
													({listing.seller.reviewCount}{" "}
													{locale === "ar" ? "تقييم" : "reviews"})
												</span>
											) : null}
										</div>
									) : null}
									{listing.seller?.bio ? (
										<p className="text-xs text-muted-foreground leading-relaxed pt-1">
											{listing.seller.bio}
										</p>
									) : null}
								</div>
							</div>

							{/* Seller Action Buttons */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border">
								<Button
									variant="outline"
									onClick={handleCall}
									disabled={!sellerPhone}
									className="text-xs font-semibold gap-2 h-10"
								>
									<Phone className="size-4 text-primary" />
									<span>{locale === "ar" ? "اتصال هاتفياً" : "Call"}</span>
								</Button>

								<Button
									variant="outline"
									onClick={handleWhatsApp}
									disabled={!sellerWhatsapp}
									className="text-xs font-semibold gap-2 h-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
								>
									<MessageCircle className="size-4" />
									<span>WhatsApp</span>
								</Button>

								<Button
									variant="outline"
									onClick={() => navigate({ to: `/${locale}/messages` })}
									className="text-xs font-semibold gap-2 h-10"
								>
									<MessageSquare className="size-4 text-primary" />
									<span>
										{locale === "ar" ? "محادثة سيارتك" : "Send Message"}
									</span>
								</Button>
							</div>
						</div>
					</div>

					{/* Right: Sticky Action & Safety Sidebar (Desktop) */}
					<div className="space-y-6">
						{/* Sticky Card 1: Main Actions */}
						<div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
							{/* Price & Status */}
							<div className="space-y-1">
								<div className="text-[28px] leading-tight font-black text-blue-600 tabular-nums">
									{listing.currency || "SDG"} {listing.price.toLocaleString()}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-[13px] font-semibold text-slate-500">
										{locale === "ar" ? "قابل للتفاوض" : "Negotiable"}
									</span>
								</div>
								<div className="pt-2">
									<Badge className="bg-emerald-50 text-emerald-700 border-0 px-2 py-0.5 rounded text-[11px]">
										{locale === "ar" ? "متاح" : "Available"}
									</Badge>
								</div>
							</div>

							{/* Seller Intro */}
							<div className="space-y-1">
								<span className="text-[11px] font-medium text-slate-500">
									{locale === "ar" ? "البائع:" : "Seller"}
								</span>
								<div className="flex flex-col gap-1">
									<span className="font-bold text-slate-900 text-[15px]">
										{listing.seller?.name ||
											(locale === "ar" ? "البائع" : "Seller")}
									</span>
									{listing.seller?.isVerified ? (
										<div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 w-fit">
											<CheckCircle2 className="size-3.5 shrink-0" />
											<span>
												{locale === "ar" ? "بائع موثّق" : "Verified Seller"}
											</span>
										</div>
									) : null}
								</div>
							</div>

							{/* Buttons */}
							<div className="space-y-2.5">
								{/* Outline Phone */}
								<a
									href={
										sellerPhone
											? `tel:${sellerPhone.replace(/[^0-9+]/g, "")}`
											: undefined
									}
									aria-disabled={!sellerPhone}
									className={`w-full h-11 rounded-lg border-2 flex items-center justify-center gap-2 font-bold text-[13px] transition-colors ${
										sellerPhone
											? "border-blue-600 text-blue-600 hover:bg-blue-50"
											: "pointer-events-none border-slate-200 text-slate-400"
									}`}
								>
									<Phone className="size-4" />
									<span className="tracking-wide">
										{sellerPhone ||
											(locale === "ar" ? "غير متاح" : "Unavailable")}
									</span>
								</a>

								{/* Solid Call */}
								<Button
									onClick={handleCall}
									disabled={!sellerPhone}
									className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] gap-2 shadow-sm"
								>
									<PhoneCall className="size-4" />
									<span>{locale === "ar" ? "اتصل الآن" : "Call Now"}</span>
								</Button>

								{/* Outline WhatsApp */}
								<Button
									variant="outline"
									onClick={handleWhatsApp}
									disabled={!sellerWhatsapp}
									className="w-full h-11 rounded-lg border border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 font-bold text-[13px] gap-2 shadow-sm"
								>
									<MessageCircle className="size-4" />
									<span>WhatsApp</span>
								</Button>

								{/* Outline Message */}
								<Button
									variant="outline"
									onClick={() => navigate({ to: `/${locale}/messages` })}
									className="w-full h-11 rounded-lg border border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 font-bold text-[13px] gap-2 shadow-sm"
								>
									<MessageSquare className="size-4" />
									<span>
										{locale === "ar" ? "إرسال رسالة للمعلن" : "Send Message"}
									</span>
								</Button>
							</div>

							{/* Quick Actions List */}
							<div className="pt-6 border-t border-slate-100 space-y-3">
								<button
									type="button"
									onClick={() => setIsFavorited(!isFavorited)}
									className="flex items-center gap-3 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors w-full"
								>
									<Heart
										className={`size-4 shrink-0 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`}
									/>
									<span>
										{isFavorited
											? locale === "ar"
												? "تم الحفظ"
												: "Saved"
											: locale === "ar"
												? "حفظ هذا الإعلان"
												: "Save this car"}
									</span>
								</button>

								<button
									type="button"
									onClick={() => setShareSheetOpen(true)}
									className="flex items-center gap-3 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors w-full"
								>
									<Share2 className="size-4 shrink-0" />
									<span>
										{locale === "ar"
											? "مشاركة هذا الإعلان"
											: "Share this listing"}
									</span>
								</button>

								<button
									type="button"
									onClick={() => setReportDialogOpen(true)}
									className="flex items-center gap-3 text-[13px] font-medium text-slate-600 hover:text-destructive transition-colors w-full"
								>
									<Flag className="size-4 shrink-0" />
									<span>
										{locale === "ar"
											? "الإبلاغ عن مخالفة"
											: "Report this listing"}
									</span>
								</button>
							</div>
						</div>

						{/* Sticky Card 2: Safety Tips */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-sm">
							<div className="flex items-center gap-2">
								<ShieldCheck className="size-5 text-slate-700" />
								<span className="font-bold text-slate-900">
									{locale === "ar" ? "نصائح الأمان" : "Safety Tips"}
								</span>
							</div>

							<ul className="space-y-3 text-[13px] text-slate-600 font-medium">
								<li className="flex items-start gap-2.5">
									<MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
									<span>
										{locale === "ar"
											? "التقِ بالبائع دائماً في أماكن عامة ومأهولة."
											: "Meet in safe, public places"}
									</span>
								</li>
								<li className="flex items-start gap-2.5">
									<CheckCircle2 className="size-4 text-slate-400 shrink-0 mt-0.5" />
									<span>
										{locale === "ar"
											? "تحقق من مستندات الملكية ورقم الشاسيه رسمياً."
											: "Verify ownership documents"}
									</span>
								</li>
								<li className="flex items-start gap-2.5">
									<Cog className="size-4 text-slate-400 shrink-0 mt-0.5" />
									<span>
										{locale === "ar"
											? "قم بفحص السيارة فنياً لدى ورشة معتمدة."
											: "Inspect the vehicle thoroughly"}
									</span>
								</li>
								<li className="flex items-start gap-2.5">
									<ShieldCheck className="size-4 text-slate-400 shrink-0 mt-0.5" />
									<span>
										{locale === "ar"
											? "تجنب تحويل أي دفعات مسبقة."
											: "Avoid advance payments"}
									</span>
								</li>
								<li className="flex items-start gap-2.5">
									<Flag className="size-4 text-slate-400 shrink-0 mt-0.5" />
									<span>
										{locale === "ar"
											? "أبلغ عن أي سلوك مشبوه."
											: "Report suspicious behavior"}
									</span>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* 3. Related Cars Carousel (Matching SCR-011) */}
				<section className="space-y-4 pt-8 border-t border-border">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "سيارات مشابهة قد تهمك" : "Related Cars"}
							</h3>
							<p className="text-xs text-muted-foreground">
								{locale === "ar"
									? "سيارات دفع رباعي وعائلية مماثلة في نفس النطاق"
									: "Similar vehicles in the same price range and category"}
							</p>
						</div>
						<Link
							to="/$locale/listings"
							params={{ locale }}
							search={{ categoryId: "cat-suv" }}
							className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
						>
							<span>{locale === "ar" ? "عرض الكل" : "View all"}</span>
							{dir === "rtl" ? (
								<ChevronLeft className="size-4" />
							) : (
								<ChevronRight className="size-4" />
							)}
						</Link>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
						{relatedListings.map((car) => (
							<ListingCard key={car.id} listing={car} variant="grid" />
						))}
					</div>
				</section>

				{/* 4. Recently Viewed */}
				<section className="space-y-4 pt-8 border-t border-slate-200">
					<div>
						<h3 className="font-heading text-xl font-bold text-slate-900">
							{locale === "ar" ? "شوهدت مؤخراً" : "Recently Viewed"}
						</h3>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{MOCK_SEARCH_LISTINGS.slice(0, 2).map((car) => (
							<ListingCard
								key={`recent-${car.id}`}
								listing={car}
								variant="horizontal"
							/>
						))}
					</div>
				</section>
			</div>

			{/* Lightbox Modal (OVR-006) */}
			<GalleryLightbox
				open={lightboxOpen}
				onOpenChange={setLightboxOpen}
				images={images}
				initialIndex={selectedImageIndex}
				title={listing.title}
				onShare={() => {
					setLightboxOpen(false);
					setShareSheetOpen(true);
				}}
			/>

			{/* Share Sheet (OVR-007) */}
			<ShareSheet
				open={shareSheetOpen}
				onOpenChange={setShareSheetOpen}
				listing={{
					id: listing.id,
					title: listing.title,
					price: listing.price,
					currency: listing.currency,
					city: listing.city,
					district: listing.district,
					image: images[0],
				}}
			/>

			{/* Report Dialog (OVR-008) */}
			<ReportDialog
				open={reportDialogOpen}
				onOpenChange={setReportDialogOpen}
				listingId={listing.id}
			/>
		</div>
	);
}
