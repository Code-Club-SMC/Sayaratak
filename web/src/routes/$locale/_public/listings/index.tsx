import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Heart,
	LayoutGrid,
	List,
	MapPin,
	RotateCw,
	Search,
	SlidersHorizontal,
	WifiOff,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
	type FilterChipItem,
	FilterChips,
} from "@/components/domain/filter-chips";
import { FilterDrawer } from "@/components/domain/filter-drawer";
import { FilterSidebar } from "@/components/domain/filter-sidebar";
import { ListingCard } from "@/components/domain/listing-card";
import { ListingGridSkeleton } from "@/components/domain/listing-card-skeleton";
import {
	LocationSelectorModal,
	type SelectedLocation,
} from "@/components/domain/location-selector-modal";
import {
	SortBottomSheet,
	type SortOption,
} from "@/components/domain/sort-bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";
import { listingsQueryOptions } from "@/lib/query-options/listings";

const searchSchema = z.object({
	q: z.string().optional().catch(undefined),
	tab: z.enum(["buy", "rent"]).optional().catch("buy"),
	categoryId: z.string().optional().catch(undefined),
	makeId: z.string().optional().catch(undefined),
	modelId: z.string().optional().catch(undefined),
	cityId: z.string().optional().catch(undefined),
	districtId: z.string().optional().catch(undefined),
	cityName: z.string().optional().catch(undefined),
	districtName: z.string().optional().catch(undefined),
	vehicleType: z.string().optional().catch(undefined),
	sellerType: z.string().optional().catch(undefined),
	minPrice: z.coerce.number().optional().catch(undefined),
	maxPrice: z.coerce.number().optional().catch(undefined),
	minYear: z.coerce.number().optional().catch(undefined),
	maxYear: z.coerce.number().optional().catch(undefined),
	maxMileage: z.coerce.number().optional().catch(undefined),
	transmission: z.string().optional().catch(undefined),
	fuelType: z.string().optional().catch(undefined),
	condition: z.string().optional().catch(undefined),
	sort: z
		.enum(["newest", "price_asc", "price_desc", "mileage_asc"])
		.optional()
		.catch("newest"),
	view: z.enum(["grid", "list"]).optional().catch("grid"),
	page: z.coerce.number().int().positive().optional().catch(1),
	limit: z.coerce.number().int().positive().optional().catch(20),
});

export type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/$locale/_public/listings/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search }) => search,
	loader: ({ context, params, deps }) => {
		return context.queryClient.ensureQueryData(
			listingsQueryOptions(params.locale, deps),
		);
	},
	component: ListingsSearchPage,
});

function ListingsSearchPage() {
	const { locale, t, dir } = useTranslation();
	const navigate = useNavigate();
	const searchParams = Route.useSearch();

	// Modal states
	const [locationModalOpen, setLocationModalOpen] = useState(false);
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
	const [isSearchSaved, setIsSearchSaved] = useState(false);

	// Keyword search input state
	const [searchQuery, setSearchQuery] = useState(searchParams.q ?? "");

	// Query data (SSR preloaded + client reactive)
	const { data, isLoading, isError, refetch } = useQuery(
		listingsQueryOptions(locale, searchParams),
	);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;
	const currentPage = searchParams.page ?? 1;
	const currentSort = (searchParams.sort ?? "newest") as SortOption;
	const currentView = searchParams.view ?? "grid";
	const currentLimit = searchParams.limit ?? 20;

	// Update search params in URL
	function updateSearch(updates: Partial<SearchParams>) {
		navigate({
			search: (prev: SearchParams) => ({
				...prev,
				...updates,
				// Reset to page 1 whenever filters or query change (unless explicitly setting page)
				page: updates.page !== undefined ? updates.page : 1,
			}),
		});
	}

	function _handleQuerySubmit(e: React.FormEvent) {
		e.preventDefault();
		updateSearch({ q: searchQuery.trim() || undefined });
	}

	function handleLocationSelect(loc: SelectedLocation) {
		updateSearch({
			cityId: loc.cityId,
			cityName: loc.cityName,
			districtId: loc.districtId,
			districtName: loc.districtName,
		});
	}

	function handleClearAllFilters() {
		navigate({
			search: {
				tab: searchParams.tab,
				view: searchParams.view,
				page: 1,
				limit: searchParams.limit,
			},
		});
	}

	function handleRemoveChip(chipKey: string) {
		switch (chipKey) {
			case "city":
				updateSearch({
					cityId: undefined,
					cityName: undefined,
					districtId: undefined,
					districtName: undefined,
				});
				break;
			case "category":
				updateSearch({ categoryId: undefined });
				break;
			case "price":
				updateSearch({ minPrice: undefined, maxPrice: undefined });
				break;
			case "year":
				updateSearch({ minYear: undefined, maxYear: undefined });
				break;
			case "vehicleType":
				updateSearch({ vehicleType: undefined });
				break;
			case "transmission":
				updateSearch({ transmission: undefined });
				break;
			case "fuelType":
				updateSearch({ fuelType: undefined });
				break;
			case "condition":
				updateSearch({ condition: undefined });
				break;
			case "sellerType":
				updateSearch({ sellerType: undefined });
				break;
			case "q":
				setSearchQuery("");
				updateSearch({ q: undefined });
				break;
		}
	}

	// Build active filter chips for display
	const activeChips: FilterChipItem[] = [];
	if (searchParams.cityName) {
		activeChips.push({
			key: "city",
			label: `${searchParams.cityName}${searchParams.districtName ? `, ${searchParams.districtName}` : ""}`,
			value: searchParams.cityId ?? "city",
		});
	}
	if (searchParams.categoryId) {
		activeChips.push({
			key: "category",
			label:
				searchParams.categoryId === "cat-sedan"
					? locale === "ar"
						? "سيدان"
						: "Sedan"
					: searchParams.categoryId === "cat-suv"
						? locale === "ar"
							? "دفع رباعي"
							: "SUV"
						: searchParams.categoryId,
			value: searchParams.categoryId,
		});
	}
	if (
		searchParams.minPrice !== undefined ||
		searchParams.maxPrice !== undefined
	) {
		const minStr = searchParams.minPrice
			? searchParams.minPrice.toLocaleString()
			: "0";
		const maxStr = searchParams.maxPrice
			? searchParams.maxPrice.toLocaleString()
			: "∞";
		activeChips.push({
			key: "price",
			label: `${locale === "ar" ? "السعر:" : "Price:"} SDG ${minStr} - ${maxStr}`,
			value: "price",
		});
	}
	if (
		searchParams.minYear !== undefined ||
		searchParams.maxYear !== undefined
	) {
		const minYear = searchParams.minYear ?? 1990;
		const maxYear = searchParams.maxYear ?? new Date().getFullYear();
		activeChips.push({
			key: "year",
			label: `${locale === "ar" ? "السنة:" : "Year:"} ${minYear} - ${maxYear}`,
			value: "year",
		});
	}
	if (searchParams.vehicleType) {
		activeChips.push({
			key: "vehicleType",
			label: searchParams.vehicleType,
			value: searchParams.vehicleType,
		});
	}
	if (searchParams.transmission) {
		activeChips.push({
			key: "transmission",
			label:
				searchParams.transmission === "automatic"
					? t.listing.automatic
					: t.listing.manual,
			value: searchParams.transmission,
		});
	}
	if (searchParams.fuelType) {
		activeChips.push({
			key: "fuelType",
			label: searchParams.fuelType,
			value: searchParams.fuelType,
		});
	}
	if (searchParams.q) {
		activeChips.push({
			key: "q",
			label: `"${searchParams.q}"`,
			value: searchParams.q,
		});
	}

	const activeFilterCount = activeChips.length;

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
			{/* Top Summary / Search Context Bar (SCR-002) */}
			<div className="border-b border-border bg-white px-4 py-4 shadow-sm">
				<div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex flex-wrap items-center">
						{/* Search Intent */}
						<div className="flex flex-col pe-6 lg:pe-12 border-e border-slate-200">
							<span className="text-[11px] text-slate-500 font-medium mb-1.5">
								{t.common.search || "Search"}
							</span>
							<span className="text-[13px] font-bold text-slate-900">
								{searchParams.tab === "rent" ? t.search.rent : t.search.buy}
							</span>
						</div>

						{/* Location Indicator & Modal Trigger */}
						<div className="flex flex-col px-6 lg:px-12 border-e border-slate-200">
							<span className="text-[11px] text-slate-500 font-medium mb-1.5">
								{t.listing.city || "Location"}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-[13px] font-bold text-slate-900">
									{searchParams.cityName ??
										(locale === "ar" ? "الخرطوم، السودان" : "Khartoum, Sudan")}
								</span>
								<button
									type="button"
									onClick={() => setLocationModalOpen(true)}
									className="text-blue-600 text-[13px] font-medium hover:underline"
								>
									{t.search.changeLocation || "Change"}
								</button>
							</div>
						</div>

						{/* Category */}
						<div className="flex flex-col px-6 lg:px-12 border-e border-slate-200 hidden sm:flex">
							<span className="text-[11px] text-slate-500 font-medium mb-1.5">
								{t.listing.category || "Category"}
							</span>
							<span className="text-[13px] font-bold text-slate-900">
								{searchParams.categoryId ?? t.search.allCategories}
							</span>
						</div>

						{/* Keywords */}
						<div className="flex flex-col ps-6 lg:ps-12 hidden md:flex">
							<span className="text-[11px] text-slate-500 font-medium mb-1.5">
								{t.search.keywords || "Keywords"}
							</span>
							<span className="text-[13px] font-bold text-slate-900">
								{searchParams.q || (locale === "ar" ? "الكل" : "All")}
							</span>
						</div>
					</div>

					{/* Save Search Button */}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => setIsSearchSaved(!isSearchSaved)}
							className={`h-9 px-4 text-[13px] font-semibold gap-2 transition-colors rounded-lg border-blue-600 ${
								isSearchSaved
									? "bg-blue-50 text-blue-600"
									: "text-blue-600 hover:bg-blue-50"
							}`}
						>
							{isSearchSaved ? (
								<>
									<Heart className="size-4 fill-current" />
									<span>{locale === "ar" ? "تم الحفظ" : "Save Search"}</span>
								</>
							) : (
								<>
									<Heart className="size-4" />
									<span>{t.search.saveSearch || "Save Search"}</span>
								</>
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="container mx-auto max-w-7xl px-4 py-6">
				{/* Results Header: Count, Chips, Sort & Views */}
				<div className="space-y-3 mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						{/* Results Count */}
						<div className="flex items-baseline gap-2">
							<h1 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
								{total.toLocaleString()}
							</h1>
							<span className="text-sm font-medium text-slate-900">
								{locale === "ar" ? "نتيجة معروضة" : "results found"}
							</span>
						</div>

						{/* Desktop & Mobile Actions */}
						<div className="flex items-center gap-3 self-end sm:self-auto">
							{/* Mobile Filter Trigger Button */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setFilterDrawerOpen(true)}
								className="lg:hidden h-10 text-[13px] font-semibold gap-2 relative rounded-lg"
							>
								<SlidersHorizontal className="size-4" />
								<span>{t.filters.filters}</span>
								{activeFilterCount > 0 && (
									<Badge className="size-5 p-0 text-[10px] font-bold rounded-full bg-blue-600 text-white flex items-center justify-center">
										{activeFilterCount}
									</Badge>
								)}
							</Button>

							{/* Mobile Sort Trigger Button */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSortDrawerOpen(true)}
								className="sm:hidden h-10 text-[13px] font-semibold gap-2 rounded-lg"
							>
								<ArrowUpDown className="size-4" />
								<span>{t.filters.sortBy}</span>
							</Button>

							{/* Desktop Sort Dropdown */}
							<div className="hidden sm:flex items-center gap-2 text-[13px] text-slate-900">
								<span className="text-slate-500 font-medium shrink-0">
									Sort by:
								</span>
								<div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
									<NativeSelect
										value={currentSort}
										onChange={(e) =>
											updateSearch({ sort: e.target.value as SortOption })
										}
										className="border-0 bg-transparent py-2 shadow-none font-semibold text-slate-900 focus-visible:ring-0 text-[13px] h-10"
									>
										<option value="newest">
											{t.filters.newest || "Newest First"}
										</option>
										<option value="price_asc">
											{t.filters.priceAsc || "Price: Low to High"}
										</option>
										<option value="price_desc">
											{t.filters.priceDesc || "Price: High to Low"}
										</option>
										<option value="mileage_asc">
											{t.filters.mileageAsc || "Mileage: Low to High"}
										</option>
									</NativeSelect>
								</div>
							</div>

							{/* View Mode Switcher (Grid / List / Map) */}
							<div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white p-1 h-10">
								<button
									type="button"
									onClick={() => updateSearch({ view: "grid" })}
									className={`p-1.5 rounded-md transition-colors ${
										currentView === "grid"
											? "bg-blue-600 text-white shadow-sm"
											: "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
									}`}
									aria-label={t.search.viewGrid}
								>
									<LayoutGrid className="size-[18px]" />
								</button>
								<button
									type="button"
									onClick={() => updateSearch({ view: "list" })}
									className={`p-1.5 rounded-md transition-colors ${
										currentView === "list"
											? "bg-blue-600 text-white shadow-sm"
											: "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
									}`}
									aria-label={t.search.viewList}
								>
									<List className="size-[18px]" />
								</button>
								<div className="w-px h-5 bg-slate-200 mx-1.5"></div>
								<Link
									to="/$locale/listings/map"
									params={{ locale }}
									search={searchParams}
									className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
									aria-label={t.search.viewMap}
								>
									<MapPin className="size-[18px]" />
								</Link>
							</div>
						</div>
					</div>

					{/* Active Filter Chips */}
					{activeChips.length > 0 && (
						<FilterChips
							chips={activeChips}
							onRemove={handleRemoveChip}
							onClearAll={handleClearAllFilters}
						/>
					)}
				</div>

				{/* Two-Column Grid: Filter Sidebar + Results */}
				<div className="flex items-start gap-6">
					{/* Left: Desktop Filter Sidebar */}
					<FilterSidebar
						filters={{
							...searchParams,
							cityName: searchParams.cityName,
							districtName: searchParams.districtName,
						}}
						onFilterChange={(updates) => updateSearch(updates)}
						onReset={handleClearAllFilters}
						onApply={() => {}}
						onOpenLocationModal={() => setLocationModalOpen(true)}
						className="hidden lg:block"
					/>

					{/* Right: Listings Content Area */}
					<main className="flex-1 min-w-0 space-y-6">
						{isLoading ? (
							<ListingGridSkeleton count={8} />
						) : isError ? (
							/* Error State */
							<div className="rounded-2xl border border-destructive/20 bg-card p-12 text-center shadow-xs max-w-md mx-auto my-12">
								<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
									<WifiOff className="size-7" />
								</div>
								<h3 className="font-heading text-lg font-bold text-foreground">
									{t.search.somethingWentWrong}
								</h3>
								<p className="mt-1 text-xs text-muted-foreground">
									{t.search.couldNotLoad}
								</p>
								<Button
									onClick={() => refetch()}
									size="sm"
									className="mt-6 gap-2 text-xs font-semibold"
								>
									<RotateCw className="size-3.5" />
									{t.search.tryAgain}
								</Button>
							</div>
						) : items.length === 0 ? (
							/* Empty State (Matching SCR-002) */
							<div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xs max-w-md mx-auto my-12">
								<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
									<Search className="size-7" />
								</div>
								<h3 className="font-heading text-lg font-bold text-foreground">
									{t.search.noListingsFound}
								</h3>
								<p className="mt-1 text-xs text-muted-foreground">
									{t.search.adjustFiltersHint}
								</p>
								<Button
									variant="outline"
									onClick={handleClearAllFilters}
									size="sm"
									className="mt-6 text-xs font-semibold"
								>
									{t.search.clearFilters}
								</Button>
							</div>
						) : (
							<>
								{/* Listing Cards Container */}
								{currentView === "grid" ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
										{items.map((listing) => (
											<ListingCard
												key={listing.id}
												listing={listing}
												variant="grid"
											/>
										))}
									</div>
								) : (
									<div className="space-y-4">
										{items.map((listing) => (
											<ListingCard
												key={listing.id}
												listing={listing}
												variant="horizontal"
											/>
										))}
									</div>
								)}

								{/* Pagination Controls & Per-Page Selector (SCR-002) */}
								<div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
									{/* Pagination Numbers */}
									<div className="flex items-center gap-1 text-xs">
										<Button
											variant="outline"
											size="sm"
											disabled={currentPage <= 1}
											onClick={() => updateSearch({ page: currentPage - 1 })}
											className="size-8 p-0"
											aria-label="Previous Page"
										>
											{dir === "rtl" ? (
												<ChevronRight className="size-4" />
											) : (
												<ChevronLeft className="size-4" />
											)}
										</Button>

										{Array.from({ length: Math.min(totalPages, 5) }).map(
											(_, idx) => {
												const pageNum = idx + 1;
												const isActive = pageNum === currentPage;
												return (
													<Button
														key={pageNum}
														variant={isActive ? "default" : "outline"}
														size="sm"
														onClick={() => updateSearch({ page: pageNum })}
														className={`size-8 p-0 text-xs font-semibold tabular-nums ${
															isActive
																? "bg-primary text-primary-foreground font-bold"
																: ""
														}`}
													>
														{pageNum}
													</Button>
												);
											},
										)}

										{totalPages > 5 && (
											<>
												<span className="px-1 text-muted-foreground">...</span>
												<Button
													variant={
														currentPage === totalPages ? "default" : "outline"
													}
													size="sm"
													onClick={() => updateSearch({ page: totalPages })}
													className="size-8 p-0 text-xs font-semibold tabular-nums"
												>
													{totalPages}
												</Button>
											</>
										)}

										<Button
											variant="outline"
											size="sm"
											disabled={currentPage >= totalPages}
											onClick={() => updateSearch({ page: currentPage + 1 })}
											className="size-8 p-0"
											aria-label="Next Page"
										>
											{dir === "rtl" ? (
												<ChevronLeft className="size-4" />
											) : (
												<ChevronRight className="size-4" />
											)}
										</Button>
									</div>

									{/* Show Per Page Selector */}
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{t.search.showPerPage}</span>
										<NativeSelect
											value={currentLimit}
											onChange={(e) =>
												updateSearch({ limit: Number(e.target.value), page: 1 })
											}
											className="w-auto [&_select]:h-8 [&_select]:text-xs"
										>
											<option value={10}>10</option>
											<option value={20}>20</option>
											<option value={50}>50</option>
										</NativeSelect>
										<span>{t.search.perPage}</span>
									</div>
								</div>
							</>
						)}
					</main>
				</div>
			</div>

			{/* Location Selector Modal (OVR-002) */}
			<LocationSelectorModal
				open={locationModalOpen}
				onOpenChange={setLocationModalOpen}
				onSelectLocation={handleLocationSelect}
				currentCityId={searchParams.cityId}
				currentDistrictId={searchParams.districtId}
			/>

			{/* Mobile Sort Bottom Sheet (OVR-004) */}
			<SortBottomSheet
				open={sortDrawerOpen}
				onOpenChange={setSortDrawerOpen}
				value={currentSort}
				onChange={(val) => updateSearch({ sort: val })}
			/>

			{/* Mobile Filter Drawer (OVR-003) */}
			<FilterDrawer
				open={filterDrawerOpen}
				onOpenChange={setFilterDrawerOpen}
				filters={{
					...searchParams,
					cityName: searchParams.cityName,
					districtName: searchParams.districtName,
				}}
				totalResults={total}
				onApplyFilters={(updates) => updateSearch(updates)}
				onClearAll={handleClearAllFilters}
			/>
		</div>
	);
}
