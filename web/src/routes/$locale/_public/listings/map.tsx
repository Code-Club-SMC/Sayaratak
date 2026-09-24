import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Bookmark,
	Building2,
	Car,
	ChevronDown,
	Compass,
	Crosshair,
	Heart,
	Info,
	Layers,
	MapPin,
	Minus,
	Navigation,
	Plus,
	Search,
	SlidersHorizontal,
	User,
	Wrench,
	X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { FilterDrawer } from "@/components/domain/filter-drawer";
import {
	LocationSelectorModal,
	type SelectedLocation,
} from "@/components/domain/location-selector-modal";
import { MapListingPreviewCard } from "@/components/domain/map-listing-preview-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";
import {
	listingsQueryOptions,
	MOCK_SEARCH_LISTINGS,
} from "@/lib/query-options/listings";

const mapSearchSchema = z.object({
	q: z.string().optional().catch(undefined),
	tab: z
		.enum(["all", "vehicles", "dealerships", "workshops", "mechanics"])
		.optional()
		.catch("vehicles"),
	categoryId: z.string().optional().catch(undefined),
	cityId: z.string().optional().catch("city-khartoum"),
	districtId: z.string().optional().catch(undefined),
	cityName: z.string().optional().catch(undefined),
	districtName: z.string().optional().catch(undefined),
	distance: z.coerce.number().optional().catch(25),
	minPrice: z.coerce.number().optional().catch(undefined),
	maxPrice: z.coerce.number().optional().catch(undefined),
	verifiedOnly: z.boolean().optional().catch(false),
	sort: z
		.enum(["nearest", "newest", "price_asc", "price_desc"])
		.optional()
		.catch("nearest"),
});

export const Route = createFileRoute("/$locale/_public/listings/map")({
	validateSearch: (search) => mapSearchSchema.parse(search),
	loaderDeps: ({ search }) => search,
	loader: ({ context, params, deps }) => {
		return context.queryClient.ensureQueryData(
			listingsQueryOptions(params.locale, {
				categoryId: deps.categoryId,
				cityId: deps.cityId,
				districtId: deps.districtId,
				minPrice: deps.minPrice,
				maxPrice: deps.maxPrice,
			}),
		);
	},
	component: MapSearchPage,
});

// Map markers with Khartoum relative coordinate positions (percentages)
const MAP_CLUSTERS = [
	{
		id: "cl-1",
		nameEn: "Khartoum North",
		nameAr: "بحري",
		count: 65,
		x: 48,
		y: 18,
	},
	{
		id: "cl-2",
		nameEn: "Bahri West",
		nameAr: "غرب بحري",
		count: 28,
		x: 37,
		y: 24,
	},
	{
		id: "cl-3",
		nameEn: "Omdurman North",
		nameAr: "شمال أم درمان",
		count: 42,
		x: 24,
		y: 48,
	},
	{
		id: "cl-4",
		nameEn: "Omdurman Center",
		nameAr: "أم درمان",
		count: 136,
		x: 32,
		y: 56,
	},
	{
		id: "cl-5",
		nameEn: "Khartoum Central",
		nameAr: "الخرطوم",
		count: 53,
		x: 52,
		y: 64,
	},
	{
		id: "cl-6",
		nameEn: "Southern Khartoum",
		nameAr: "جنوب الخرطوم",
		count: 38,
		x: 49,
		y: 74,
	},
	{
		id: "cl-7",
		nameEn: "Al Salha",
		nameAr: "الصالحة",
		count: 21,
		x: 62,
		y: 79,
	},
	{
		id: "cl-8",
		nameEn: "Jebel Aulia",
		nameAr: "جبل أولياء",
		count: 17,
		x: 34,
		y: 83,
	},
	{
		id: "cl-9",
		nameEn: "East Nile",
		nameAr: "شرق النيل",
		count: 97,
		x: 63,
		y: 48,
	},
];

const MAP_LISTINGS_POSITIONS: {
	[id: string]: { x: number; y: number; distanceKm: number };
} = {
	"lst-001": { x: 47, y: 42, distanceKm: 2.1 }, // Toyota Land Cruiser (Al Riyadh)
	"lst-002": { x: 50, y: 46, distanceKm: 2.4 }, // Hyundai Elantra (Al Riyadh)
	"lst-003": { x: 30, y: 52, distanceKm: 3.7 }, // Toyota Hilux (Omdurman)
	"lst-004": { x: 46, y: 28, distanceKm: 4.2 }, // Toyota Hiace (Bahri)
	"lst-005": { x: 26, y: 62, distanceKm: 5.1 }, // TVS King Deluxe (Al Salha)
	"lst-006": { x: 54, y: 39, distanceKm: 3.2 }, // Bajaj Boxer (Al Amir)
	"lst-007": { x: 44, y: 49, distanceKm: 2.8 }, // Alloy Wheel (Industrial)
	"lst-008": { x: 43, y: 51, distanceKm: 3.0 }, // Radiator (Industrial)
};

function MapSearchPage() {
	const { locale, t, dir } = useTranslation();
	const navigate = useNavigate();
	const searchParams = Route.useSearch();

	// Modals & Map state
	const [locationModalOpen, setLocationModalOpen] = useState(false);
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [searchAsMove, setSearchAsMove] = useState(true);
	const [zoom, setZoom] = useState(12);
	const [selectedListingId, setSelectedListingId] = useState<string | null>(
		"lst-001",
	);
	const [searchInput, setSearchInput] = useState(searchParams.q ?? "");
	const [isSaved, setIsSaved] = useState(false);

	const { data } = useQuery(
		listingsQueryOptions(locale, {
			categoryId: searchParams.categoryId,
			cityId: searchParams.cityId,
			districtId: searchParams.districtId,
			minPrice: searchParams.minPrice,
			maxPrice: searchParams.maxPrice,
		}),
	);

	const listings = data?.items || MOCK_SEARCH_LISTINGS;
	const selectedListing =
		listings.find((l) => l.id === selectedListingId) || listings[0];

	function updateSearch(updates: Partial<typeof searchParams>) {
		navigate({
			search: (prev: typeof searchParams) => ({
				...prev,
				...updates,
			}),
		});
	}

	function handleZoomIn() {
		setZoom((z) => Math.min(z + 1, 18));
	}

	function handleZoomOut() {
		setZoom((z) => Math.max(z - 1, 8));
	}

	function handleRecenter() {
		setZoom(12);
	}

	function handleLocationSelect(loc: SelectedLocation) {
		updateSearch({
			cityId: loc.cityId,
			cityName: loc.cityName,
			districtId: loc.districtId,
			districtName: loc.districtName,
		});
	}

	const selectedDistance = searchParams.distance ?? 25;

	return (
		<div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
			{/* 1. Top Search Header Strip (Matching SCR-003) */}
			<header className="border-b border-border bg-card px-4 py-2.5 shrink-0 z-20 shadow-xs">
				<div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-3 flex-1">
						{/* Search Input */}
						<div className="relative min-w-[220px] flex-1 max-w-xs">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder={
									locale === "ar"
										? "مثال: تويوتا لاندكروزر..."
										: "e.g., Toyota Land Cruiser"
								}
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										updateSearch({ q: searchInput.trim() || undefined });
									}
								}}
								className="ps-9 h-9 text-xs"
							/>
						</div>

						{/* Location Button */}
						<button
							type="button"
							onClick={() => setLocationModalOpen(true)}
							className="h-9 px-3 rounded-lg border border-input bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
						>
							<MapPin className="size-3.5 text-primary" />
							<span>
								{searchParams.cityName ||
									(locale === "ar" ? "الخرطوم، السودان" : "Khartoum, Sudan")}
							</span>
							<ChevronDown className="size-3 text-muted-foreground ms-1" />
						</button>

						{/* Category Select */}
						<NativeSelect
							value={searchParams.categoryId ?? ""}
							onChange={(e) =>
								updateSearch({ categoryId: e.target.value || undefined })
							}
							className="w-auto [&_select]:h-9 [&_select]:text-xs [&_select]:font-semibold"
						>
							<option value="">{t.search.allCategories}</option>
							<option value="cat-sedan">
								{locale === "ar" ? "سيدان" : "Sedan"}
							</option>
							<option value="cat-suv">
								{locale === "ar" ? "دفع رباعي" : "SUVs"}
							</option>
							<option value="cat-pickup">
								{locale === "ar" ? "بك آب" : "Pickups"}
							</option>
							<option value="cat-van">
								{locale === "ar" ? "حافلات" : "Vans"}
							</option>
							<option value="cat-spare-parts">
								{locale === "ar" ? "قطع غيار" : "Spare Parts"}
							</option>
						</NativeSelect>

						{/* Price Display */}
						<div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
							<span>{locale === "ar" ? "السعر:" : "Price:"}</span>
							<span className="font-semibold text-foreground">
								SDG 10,000 – 250,000,000
							</span>
						</div>
					</div>

					{/* Top Actions: More Filters & Save Search */}
					<div className="flex items-center gap-2 self-end md:self-auto">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setFilterDrawerOpen(true)}
							className="h-9 text-xs font-semibold gap-1.5"
						>
							<SlidersHorizontal className="size-3.5" />
							<span>{locale === "ar" ? "فلاتر إضافية" : "More Filters"}</span>
						</Button>

						<Button
							size="sm"
							onClick={() => setIsSaved(!isSaved)}
							className="h-9 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
						>
							<Bookmark className={`size-3.5 ${isSaved ? "fill-white" : ""}`} />
							<span>
								{isSaved
									? locale === "ar"
										? "تم الحفظ"
										: "Saved"
									: t.search.saveSearch}
							</span>
						</Button>
					</div>
				</div>
			</header>

			{/* 2. Domain Entity Tabs Strip (SCR-003) */}
			<div className="border-b border-border bg-card/60 px-4 py-1.5 shrink-0 z-10">
				<div className="container mx-auto max-w-7xl flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
					<button
						type="button"
						onClick={() => updateSearch({ tab: "all" })}
						className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
							searchParams.tab === "all"
								? "bg-primary/10 text-primary border border-primary/20"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<span>{t.search.allTab}</span>
						<span className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] tabular-nums">
							3,482
						</span>
					</button>

					<button
						type="button"
						onClick={() => updateSearch({ tab: "vehicles" })}
						className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
							searchParams.tab === "vehicles"
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Car className="size-3.5" />
						<span>{t.search.vehiclesTab}</span>
						<span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] tabular-nums">
							2,745
						</span>
					</button>

					<button
						type="button"
						onClick={() => updateSearch({ tab: "dealerships" })}
						className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
							searchParams.tab === "dealerships"
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Building2 className="size-3.5" />
						<span>{t.search.dealershipsTab}</span>
						<span className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] tabular-nums">
							456
						</span>
					</button>

					<button
						type="button"
						onClick={() => updateSearch({ tab: "workshops" })}
						className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
							searchParams.tab === "workshops"
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Wrench className="size-3.5" />
						<span>{t.search.workshopsTab}</span>
						<span className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] tabular-nums">
							189
						</span>
					</button>

					<button
						type="button"
						onClick={() => updateSearch({ tab: "mechanics" })}
						className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
							searchParams.tab === "mechanics"
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<User className="size-3.5" />
						<span>{t.search.mechanicsTab}</span>
						<span className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] tabular-nums">
							92
						</span>
					</button>
				</div>
			</div>

			{/* 3. Three-Column Map Search Viewport */}
			<div className="flex-1 flex min-h-0 relative">
				{/* Left Column: Map Filters Sidebar (Desktop) */}
				<aside className="hidden xl:flex flex-col w-72 shrink-0 border-e border-border bg-card overflow-y-auto p-4 space-y-4">
					<div className="flex items-center justify-between border-b border-border pb-3">
						<h3 className="font-heading text-sm font-bold text-foreground">
							{t.search.mapFilters}
						</h3>
						<button
							type="button"
							onClick={() =>
								navigate({
									search: {
										cityId: searchParams.cityId,
										tab: searchParams.tab,
									},
								})
							}
							className="text-xs font-semibold text-primary hover:underline"
						>
							{t.filters.clearAll}
						</button>
					</div>

					{/* Search in Map Area */}
					<div className="space-y-1.5">
						<label
							htmlFor="map-search-query"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.searchInMapArea}
						</label>
						<div className="relative">
							<Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<Input
								id="map-search-query"
								type="text"
								placeholder={
									locale === "ar"
										? "ابحث داخل الخريطة..."
										: "Search within map..."
								}
								className="ps-8 h-9 text-xs"
							/>
						</div>
					</div>

					{/* Distance Selector */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-foreground">
								{t.search.distance}
							</span>
							<span className="text-primary font-bold">
								{selectedDistance} km
							</span>
						</div>
						<NativeSelect
							value={selectedDistance}
							onChange={(e) =>
								updateSearch({ distance: Number(e.target.value) })
							}
							className="w-full [&_select]:h-9 [&_select]:text-xs"
						>
							<option value={5}>5 km</option>
							<option value={10}>10 km</option>
							<option value={25}>25 km</option>
							<option value={50}>50 km</option>
							<option value={100}>100 km</option>
						</NativeSelect>
					</div>

					{/* Location Tag */}
					<div className="space-y-1.5">
						<div className="text-xs font-semibold text-foreground">
							{t.listing.city}
						</div>
						<Badge
							variant="secondary"
							className="flex items-center justify-between w-full py-1.5 px-3 text-xs bg-primary/10 text-primary border border-primary/20"
						>
							<span className="flex items-center gap-1.5 truncate">
								<MapPin className="size-3.5 shrink-0" />
								{searchParams.cityName ||
									(locale === "ar" ? "الخرطوم، السودان" : "Khartoum, Sudan")}
							</span>
							<button
								type="button"
								onClick={() =>
									updateSearch({ cityName: undefined, cityId: undefined })
								}
								className="size-4 hover:bg-black/10 rounded-full inline-flex items-center justify-center"
							>
								<X className="size-3" />
							</button>
						</Badge>
					</div>

					{/* Category */}
					<div className="space-y-1.5">
						<label
							htmlFor="map-filter-category"
							className="text-xs font-semibold text-foreground"
						>
							{t.listing.category}
						</label>
						<NativeSelect
							id="map-filter-category"
							value={searchParams.categoryId ?? ""}
							onChange={(e) =>
								updateSearch({ categoryId: e.target.value || undefined })
							}
							className="w-full [&_select]:h-9 [&_select]:text-xs"
						>
							<option value="">{t.search.allCategories}</option>
							<option value="cat-sedan">
								{locale === "ar" ? "سيارات سيدان" : "Sedans"}
							</option>
							<option value="cat-suv">
								{locale === "ar" ? "دفع رباعي وعائلي" : "SUVs"}
							</option>
							<option value="cat-pickup">
								{locale === "ar" ? "بك آب وشاحنات" : "Pickups"}
							</option>
							<option value="cat-spare-parts">
								{locale === "ar" ? "قطع غيار" : "Spare Parts"}
							</option>
						</NativeSelect>
					</div>

					{/* Price (SDG) */}
					<div className="space-y-1.5">
						<div className="text-xs font-semibold text-foreground">
							{t.search.priceSdg}
						</div>
						<div className="flex items-center gap-2">
							<Input
								aria-label={t.search.minPricePlaceholder}
								type="number"
								placeholder={t.search.minPricePlaceholder}
								value={searchParams.minPrice ?? ""}
								onChange={(e) =>
									updateSearch({
										minPrice: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="h-8 text-xs tabular-nums"
							/>
							<span className="text-muted-foreground text-xs">
								{locale === "ar" ? "إلى" : "to"}
							</span>
							<Input
								aria-label={t.search.maxPricePlaceholder}
								type="number"
								placeholder={t.search.maxPricePlaceholder}
								value={searchParams.maxPrice ?? ""}
								onChange={(e) =>
									updateSearch({
										maxPrice: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
					</div>

					{/* Verified Only Checkbox */}
					<label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
						<Checkbox
							checked={searchParams.verifiedOnly}
							onCheckedChange={(val) =>
								updateSearch({ verifiedOnly: Boolean(val) })
							}
						/>
						<span className="text-foreground font-medium">
							{t.search.showOnlyVerified}
						</span>
					</label>

					{/* Apply Filters Button */}
					<Button
						size="sm"
						className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90"
					>
						{t.search.applyFilters}
					</Button>

					{/* Map Search Tips Box (SCR-003) */}
					<div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1 mt-auto">
						<div className="flex items-center gap-1.5 font-bold text-primary">
							<Info className="size-3.5 shrink-0" />
							<span>{t.search.mapTipTitle}</span>
						</div>
						<p className="text-[11px] text-muted-foreground leading-relaxed">
							{t.search.mapTipDesc}
						</p>
					</div>
				</aside>

				{/* Center Column: Interactive Map Canvas with Pins & Confluence */}
				<main className="flex-1 relative bg-slate-200 dark:bg-slate-900 overflow-hidden select-none">
					{/* Floating Top-Left "Search as I move the map" Toggle */}
					<div className="absolute top-4 start-4 z-20 bg-card/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border shadow-md flex items-center gap-2.5 text-xs font-semibold text-foreground">
						<Checkbox
							checked={searchAsMove}
							onCheckedChange={(val) => setSearchAsMove(Boolean(val))}
						/>
						<span>{t.search.searchAsIMove}</span>
					</div>

					{/* Floating Map Controls (Top Right) */}
					<div className="absolute top-4 end-4 z-20 flex flex-col gap-1.5">
						<div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-md overflow-hidden flex flex-col">
							<button
								type="button"
								onClick={handleZoomIn}
								className="size-9 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
								aria-label="Zoom in"
							>
								<Plus className="size-4" />
							</button>
							<div className="h-px bg-border w-full" />
							<button
								type="button"
								onClick={handleZoomOut}
								className="size-9 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
								aria-label="Zoom out"
							>
								<Minus className="size-4" />
							</button>
						</div>

						<button
							type="button"
							onClick={handleRecenter}
							className="size-9 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
							aria-label="Re-center"
						>
							<Crosshair className="size-4" />
						</button>

						<button
							type="button"
							className="size-9 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
							aria-label="Toggle map layers"
						>
							<Layers className="size-4" />
						</button>
					</div>

					{/* Bottom Map Controls: Re-center & Use my location */}
					<div className="absolute bottom-6 start-6 z-20 flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={handleRecenter}
							className="h-9 px-3.5 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-md text-xs font-semibold gap-2"
						>
							<Compass className="size-4 text-primary" />
							<span>{t.search.reCenter}</span>
						</Button>
					</div>

					<div className="absolute bottom-6 end-6 z-20 flex items-center gap-3">
						<Button
							size="sm"
							onClick={() => {
								handleLocationSelect({
									cityName:
										locale === "ar"
											? "الخرطوم (موقعي الحالي)"
											: "Khartoum (Current Location)",
									cityId: "city-khartoum",
								});
							}}
							className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-xs font-bold gap-2"
						>
							<Navigation className="size-4" />
							<span>{t.search.useMyLocation}</span>
						</Button>
					</div>

					{/* Map Canvas with Khartoum River Confluence & Geography SVG */}
					<div className="absolute inset-0 size-full overflow-hidden flex items-center justify-center">
						<svg
							className="size-full w-full h-full object-cover"
							viewBox="0 0 1000 700"
							preserveAspectRatio="xMidYMid slice"
							xmlns="http://www.w3.org/2000/svg"
							role="img"
							aria-label="Khartoum map terrain"
						>
							<title>Khartoum map terrain</title>
							{/* Background terrain */}
							<rect
								width="1000"
								height="700"
								fill="#F4F1EA"
								className="dark:fill-slate-900"
							/>

							{/* Nile Confluence (White Nile from south, Blue Nile from southeast, Main Nile flowing north) */}
							<g
								className="fill-sky-200/80 dark:fill-sky-950/60 stroke-sky-300 dark:stroke-sky-800"
								strokeWidth="2"
							>
								{/* Main Nile flowing North past Tuti Island */}
								<path d="M 500,0 C 490,80 480,140 485,220 C 490,260 480,300 460,330 L 490,335 C 510,290 520,240 515,160 C 510,100 525,40 530,0 Z" />
								{/* Blue Nile flowing from Southeast */}
								<path d="M 1000,480 C 850,460 720,430 620,400 C 560,380 500,350 470,330 L 485,310 C 520,330 580,360 640,380 C 740,410 870,440 1000,450 Z" />
								{/* White Nile flowing from South / Jebel Aulia */}
								<path d="M 400,700 C 410,620 420,530 435,460 C 445,410 455,370 460,330 L 490,335 C 485,370 475,420 465,470 C 450,540 440,630 430,700 Z" />
								{/* Tuti Island */}
								<ellipse
									cx="480"
									cy="315"
									rx="14"
									ry="24"
									fill="#E2DAC8"
									className="dark:fill-slate-800"
									stroke="#CBD5E1"
								/>
							</g>

							{/* Major Road Arteries */}
							<g
								stroke="#E5E7EB"
								className="dark:stroke-slate-800"
								strokeWidth="3"
								fill="none"
							>
								<path d="M 100,200 L 900,200" />
								<path d="M 150,400 L 850,400" />
								<path d="M 200,600 L 800,600" />
								<path d="M 300,100 L 300,650" />
								<path d="M 700,100 L 700,650" />
							</g>

							{/* District Name Labels */}
							<text
								x="530"
								y="160"
								className="fill-slate-500 font-bold text-xs"
							>
								Bahri (بحري)
							</text>
							<text
								x="260"
								y="420"
								className="fill-slate-500 font-bold text-xs"
							>
								Omdurman (أم درمان)
							</text>
							<text
								x="560"
								y="440"
								className="fill-slate-500 font-bold text-xs"
							>
								Khartoum (الخرطوم)
							</text>
							<text
								x="580"
								y="490"
								className="fill-slate-400 font-semibold text-[10px]"
							>
								Al Riyadh (الرياض)
							</text>
							<text
								x="490"
								y="520"
								className="fill-slate-400 font-semibold text-[10px]"
							>
								Al Amarat (العمارات)
							</text>
							<text
								x="360"
								y="660"
								className="fill-slate-400 font-semibold text-[10px]"
							>
								Jebel Aulia (جبل أولياء)
							</text>
						</svg>

						{/* Map Clusters HTML Layer */}
						<div className="absolute inset-0 pointer-events-none">
							{MAP_CLUSTERS.map((cl) => (
								<button
									key={cl.id}
									type="button"
									onClick={() => setZoom(zoom + 2)}
									style={{ left: `${cl.x}%`, top: `${cl.y}%` }}
									className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-blue-600/90 text-white font-bold text-xs flex items-center justify-center shadow-lg ring-4 ring-blue-400/40 hover:scale-110 hover:bg-blue-600 transition-all cursor-pointer"
								>
									{cl.count}
								</button>
							))}

							{/* Individual Car Markers */}
							{Object.entries(MAP_LISTINGS_POSITIONS).map(([lstId, pos]) => {
								const isSelected = selectedListingId === lstId;
								return (
									<div
										key={lstId}
										style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
										className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 z-10"
									>
										<button
											type="button"
											onClick={() => setSelectedListingId(lstId)}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md transition-all ${
												isSelected
													? "bg-blue-600 text-white ring-4 ring-blue-500/40 scale-110 z-20"
													: "bg-card text-foreground border border-border hover:border-primary"
											}`}
										>
											<Car className="size-3" />
											<span className="hidden sm:inline">SDG</span>
										</button>

										{/* Pulsing Pin Indicator */}
										{isSelected && (
											<div className="absolute top-full start-1/2 -translate-x-1/2 -mt-1 flex flex-col items-center">
												<div className="size-2 bg-blue-600 rounded-full" />
											</div>
										)}
									</div>
								);
							})}

							{/* Selected Listing Popup Card (OVR-035) */}
							{selectedListing && (
								<div className="pointer-events-auto absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90%] max-w-lg">
									<MapListingPreviewCard
										listing={selectedListing}
										onClose={() => setSelectedListingId(null)}
										distanceKm={
											MAP_LISTINGS_POSITIONS[selectedListing.id]?.distanceKm ??
											2.1
										}
									/>
								</div>
							)}
						</div>
					</div>

					{/* Attribution */}
					<div className="absolute bottom-2 start-2 text-[10px] text-muted-foreground/60 z-10">
						© OpenStreetMap contributors • Sayaratak Map
					</div>
				</main>

				{/* Right Column: "Results in this area" List (SCR-003) */}
				<aside className="hidden lg:flex flex-col w-96 shrink-0 border-s border-border bg-card overflow-hidden">
					{/* Panel Header */}
					<div className="p-4 border-b border-border flex items-center justify-between">
						<div>
							<h3 className="font-heading text-sm font-bold text-foreground">
								{t.search.resultsInThisArea}
							</h3>
							<span className="text-xs text-muted-foreground tabular-nums">
								{listings.length.toLocaleString()}{" "}
								{locale === "ar" ? "إعلان متاح" : "listings"}
							</span>
						</div>

						{/* Sort selector */}
						<NativeSelect
							value={searchParams.sort ?? "nearest"}
							onChange={(e) => updateSearch({ sort: e.target.value as any })}
							className="w-auto [&_select]:h-8 [&_select]:text-xs [&_select]:font-semibold"
						>
							<option value="nearest">{t.search.nearestFirst}</option>
							<option value="newest">{t.filters.newest}</option>
							<option value="price_asc">{t.filters.priceAsc}</option>
						</NativeSelect>
					</div>

					{/* Vertical Listings Scroll */}
					<div className="flex-1 overflow-y-auto p-4 space-y-3">
						{listings.map((listing) => {
							const isSelected = selectedListingId === listing.id;
							const distance =
								MAP_LISTINGS_POSITIONS[listing.id]?.distanceKm ?? 2.5;

							return (
								<button
									type="button"
									key={listing.id}
									onClick={() => setSelectedListingId(listing.id)}
									className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 text-start ${
										isSelected
											? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
											: "border-border bg-card hover:border-slate-300 dark:hover:border-slate-700"
									}`}
								>
									<img
										src={
											listing.images?.[0] ||
											"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=400&q=80"
										}
										alt={listing.title}
										className="size-20 rounded-lg object-cover shrink-0"
									/>
									<div className="flex-1 min-w-0 flex flex-col justify-between">
										<div>
											<div className="flex items-start justify-between gap-1">
												<h4 className="text-xs font-bold text-foreground truncate">
													{listing.title}
												</h4>
												<Heart className="size-3.5 text-muted-foreground shrink-0 hover:text-rose-500" />
											</div>
											<p className="text-xs font-black text-primary tabular-nums mt-0.5">
												{listing.currency || "SDG"}{" "}
												{listing.price.toLocaleString()}
											</p>
										</div>

										<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
											<span className="truncate">
												{listing.city || "Khartoum"}
												{listing.district ? `, ${listing.district}` : ""}
											</span>
											<span className="font-semibold text-foreground shrink-0">
												{distance} km
											</span>
										</div>
									</div>
								</button>
							);
						})}
					</div>

					{/* Bottom "View all results" Footer Button */}
					<div className="p-3 border-t border-border bg-card">
						<Link
							to="/$locale/listings"
							params={{ locale }}
							search={{
								q: searchParams.q,
								categoryId: searchParams.categoryId,
								cityId: searchParams.cityId,
								districtId: searchParams.districtId,
								minPrice: searchParams.minPrice,
								maxPrice: searchParams.maxPrice,
							}}
							className="block"
						>
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs font-bold h-9"
							>
								{locale === "ar"
									? `عرض جميع النتائج (${listings.length})`
									: `View all ${listings.length} results`}
							</Button>
						</Link>
					</div>
				</aside>
			</div>

			{/* Location Selector Modal */}
			<LocationSelectorModal
				open={locationModalOpen}
				onOpenChange={setLocationModalOpen}
				onSelectLocation={handleLocationSelect}
				currentCityId={searchParams.cityId}
				currentDistrictId={searchParams.districtId}
			/>

			{/* Mobile Filter Drawer */}
			<FilterDrawer
				open={filterDrawerOpen}
				onOpenChange={setFilterDrawerOpen}
				filters={{
					cityId: searchParams.cityId,
					categoryId: searchParams.categoryId,
					minPrice: searchParams.minPrice,
					maxPrice: searchParams.maxPrice,
				}}
				totalResults={listings.length}
				onApplyFilters={(updates) => updateSearch(updates)}
				onClearAll={() => navigate({ search: {} })}
			/>
		</div>
	);
}
