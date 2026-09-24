import { Calendar, SlidersHorizontal, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";
import type { ListingFilters } from "@/lib/query-keys";

type FilterDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: ListingFilters & {
		q?: string;
		vehicleType?: string;
		sellerType?: string;
		cityName?: string;
		districtName?: string;
	};
	totalResults?: number;
	onApplyFilters: (
		filters: Partial<
			ListingFilters & { q?: string; vehicleType?: string; sellerType?: string }
		>,
	) => void;
	onClearAll: () => void;
};

export function FilterDrawer({
	open,
	onOpenChange,
	filters,
	totalResults = 2846,
	onApplyFilters,
	onClearAll,
}: FilterDrawerProps) {
	const { t, locale } = useTranslation();

	// Local state for draft filters while drawer is open
	const [draftFilters, setDraftFilters] = useState(filters);

	// Sync local draft when opened or external filters change
	useEffect(() => {
		setDraftFilters(filters);
	}, [filters]);

	function handleChange(updates: Partial<typeof filters>) {
		setDraftFilters((prev) => ({ ...prev, ...updates }));
	}

	function handleApply() {
		onApplyFilters(draftFilters);
		onOpenChange(false);
	}

	function handleClear() {
		setDraftFilters({});
		onClearAll();
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="h-[90vh] max-h-[90vh] rounded-t-3xl p-0 flex flex-col bg-background"
			>
				{/* Drawer Drag Pill Indicator */}
				<div className="pt-3 pb-2 flex justify-center">
					<div className="h-1.5 w-12 rounded-full bg-muted" />
				</div>

				{/* Header */}
				<div className="px-6 py-3 border-b border-border flex items-center justify-between">
					<div className="flex items-baseline gap-3">
						<h2 className="font-heading text-lg font-bold text-foreground">
							{t.search.searchFilters}
						</h2>
						<span className="text-xs font-semibold text-muted-foreground tabular-nums">
							{totalResults.toLocaleString()}{" "}
							{locale === "ar" ? "نتيجة" : "results"}
						</span>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleClear}
							className="text-xs font-semibold text-primary hover:underline"
						>
							{t.filters.clearAll}
						</button>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="size-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="size-4" />
						</button>
					</div>
				</div>

				{/* Scrollable Form Body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
					{/* Category */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-category"
							className="text-xs font-semibold text-foreground"
						>
							{t.listing.category}
						</label>
						<NativeSelect
							id="filter-drawer-category"
							value={draftFilters.categoryId ?? ""}
							onChange={(e) =>
								handleChange({ categoryId: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allCategories}</option>
							<option value="cat-sedan">
								{locale === "ar" ? "سيارات سيدان" : "Cars (Sedan & Coupe)"}
							</option>
							<option value="cat-suv">
								{locale === "ar" ? "دفع رباعي وعائلي" : "SUVs & 4x4"}
							</option>
							<option value="cat-pickup">
								{locale === "ar" ? "بك آب وشاحنات" : "Pickups & Trucks"}
							</option>
							<option value="cat-van">
								{locale === "ar" ? "حافلات وفانات" : "Vans & Buses"}
							</option>
							<option value="cat-tuktuk">
								{locale === "ar" ? "ركشات وتوك توك" : "Tuk-Tuks"}
							</option>
							<option value="cat-motorcycle">
								{locale === "ar" ? "دراجات نارية" : "Motorcycles"}
							</option>
							<option value="cat-spare-parts">
								{locale === "ar" ? "قطع غيار" : "Spare Parts"}
							</option>
						</NativeSelect>
					</div>

					{/* City */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-city"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.city}
						</label>
						<NativeSelect
							id="filter-drawer-city"
							value={draftFilters.cityId ?? ""}
							onChange={(e) =>
								handleChange({
									cityId: e.target.value || undefined,
									districtId: undefined,
								})
							}
							className="w-full"
						>
							<option value="">
								{locale === "ar" ? "جميع المدن" : "All Cities"}
							</option>
							<option value="city-khartoum">
								{locale === "ar" ? "الخرطوم" : "Khartoum"}
							</option>
							<option value="city-omdurman">
								{locale === "ar" ? "أم درمان" : "Omdurman"}
							</option>
							<option value="city-bahri">
								{locale === "ar" ? "بحري" : "Bahri"}
							</option>
							<option value="city-port-sudan">
								{locale === "ar" ? "بورتسودان" : "Port Sudan"}
							</option>
							<option value="city-kassala">
								{locale === "ar" ? "كسلا" : "Kassala"}
							</option>
							<option value="city-qadarif">
								{locale === "ar" ? "القضارف" : "Al Qadarif"}
							</option>
						</NativeSelect>
					</div>

					{/* District / Neighborhood */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-district"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.districtNeighborhood}
						</label>
						<NativeSelect
							id="filter-drawer-district"
							value={draftFilters.districtId ?? ""}
							onChange={(e) =>
								handleChange({ districtId: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allDistricts}</option>
							<option value="dist-riyadh">
								{locale === "ar" ? "الرياض" : "Al Riyadh"}
							</option>
							<option value="dist-manshiya">
								{locale === "ar" ? "المنشية" : "Al Manshiya"}
							</option>
							<option value="dist-amarai">
								{locale === "ar" ? "العمارات" : "Al Amarat"}
							</option>
							<option value="dist-bahri">
								{locale === "ar" ? "بحري" : "Bahri"}
							</option>
							<option value="dist-thawra">
								{locale === "ar" ? "الثورة" : "Al Thawra"}
							</option>
							<option value="dist-salha">
								{locale === "ar" ? "الصالحة" : "Al Salha"}
							</option>
							<option value="dist-industrial">
								{locale === "ar" ? "المنطقة الصناعية" : "Industrial Area"}
							</option>
						</NativeSelect>
					</div>

					{/* Make */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-make"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.make}
						</label>
						<NativeSelect
							id="filter-drawer-make"
							value={draftFilters.makeId ?? ""}
							onChange={(e) =>
								handleChange({
									makeId: e.target.value || undefined,
									modelId: undefined,
								})
							}
							className="w-full"
						>
							<option value="">{t.search.allMakes}</option>
							<option value="toyota">
								{locale === "ar" ? "تويوتا" : "Toyota"}
							</option>
							<option value="hyundai">
								{locale === "ar" ? "هيونداي" : "Hyundai"}
							</option>
							<option value="nissan">
								{locale === "ar" ? "نيسان" : "Nissan"}
							</option>
							<option value="kia">{locale === "ar" ? "كيا" : "Kia"}</option>
							<option value="mitsubishi">
								{locale === "ar" ? "ميتسوبيشي" : "Mitsubishi"}
							</option>
							<option value="suzuki">
								{locale === "ar" ? "سوزوكي" : "Suzuki"}
							</option>
							<option value="bajaj">
								{locale === "ar" ? "بجاج" : "Bajaj"}
							</option>
							<option value="tvs">
								{locale === "ar" ? "تي في إس" : "TVS"}
							</option>
						</NativeSelect>
					</div>

					{/* Model */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-model"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.model}
						</label>
						<NativeSelect
							id="filter-drawer-model"
							value={draftFilters.modelId ?? ""}
							onChange={(e) =>
								handleChange({ modelId: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allModels}</option>
							<option value="land-cruiser">
								{locale === "ar" ? "لاندكروزر" : "Land Cruiser"}
							</option>
							<option value="hilux">
								{locale === "ar" ? "هايلكس" : "Hilux"}
							</option>
							<option value="elantra">
								{locale === "ar" ? "إلنترا" : "Elantra"}
							</option>
							<option value="hiace">
								{locale === "ar" ? "هايس" : "Hiace"}
							</option>
							<option value="sportage">
								{locale === "ar" ? "سبورتاج" : "Sportage"}
							</option>
							<option value="patrol">
								{locale === "ar" ? "باترول" : "Patrol"}
							</option>
							<option value="alto">{locale === "ar" ? "ألتو" : "Alto"}</option>
						</NativeSelect>
					</div>

					{/* Year Range */}
					<div className="space-y-1.5">
						<div className="text-xs font-semibold text-foreground">
							{t.search.year}
						</div>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Calendar className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
								<Input
									aria-label={t.search.minYearPlaceholder}
									type="number"
									placeholder={t.search.minYearPlaceholder}
									value={draftFilters.minYear ?? ""}
									onChange={(e) =>
										handleChange({
											minYear: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									className="ps-8 h-10 text-xs tabular-nums"
								/>
							</div>
							<span className="text-muted-foreground text-xs">
								{locale === "ar" ? "إلى" : "to"}
							</span>
							<div className="relative flex-1">
								<Calendar className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
								<Input
									aria-label={t.search.maxYearPlaceholder}
									type="number"
									placeholder={t.search.maxYearPlaceholder}
									value={draftFilters.maxYear ?? ""}
									onChange={(e) =>
										handleChange({
											maxYear: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									className="ps-8 h-10 text-xs tabular-nums"
								/>
							</div>
						</div>
					</div>

					{/* Price (SDG) Range */}
					<div className="space-y-1.5">
						<div className="text-xs font-semibold text-foreground">
							{t.search.priceSdg}
						</div>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Tag className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
								<Input
									aria-label={t.search.minPricePlaceholder}
									type="number"
									placeholder={t.search.minPricePlaceholder}
									value={draftFilters.minPrice ?? ""}
									onChange={(e) =>
										handleChange({
											minPrice: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									className="ps-8 h-10 text-xs tabular-nums"
								/>
							</div>
							<span className="text-muted-foreground text-xs">
								{locale === "ar" ? "إلى" : "to"}
							</span>
							<div className="relative flex-1">
								<Tag className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
								<Input
									aria-label={t.search.maxPricePlaceholder}
									type="number"
									placeholder={t.search.maxPricePlaceholder}
									value={draftFilters.maxPrice ?? ""}
									onChange={(e) =>
										handleChange({
											maxPrice: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
									className="ps-8 h-10 text-xs tabular-nums"
								/>
							</div>
						</div>
					</div>

					{/* Condition */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-condition"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.condition}
						</label>
						<NativeSelect
							id="filter-drawer-condition"
							value={draftFilters.condition ?? ""}
							onChange={(e) =>
								handleChange({ condition: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allConditions}</option>
							<option value="new">{t.listing.newListing}</option>
							<option value="used_excellent">
								{locale === "ar" ? "مستعمل - ممتاز" : "Used - Excellent"}
							</option>
							<option value="used_good">
								{locale === "ar" ? "مستعمل - جيد" : "Used - Good"}
							</option>
							<option value="used_fair">
								{locale === "ar" ? "مستعمل - مقبول" : "Used - Fair"}
							</option>
						</NativeSelect>
					</div>

					{/* Transmission */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-transmission"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.transmission}
						</label>
						<NativeSelect
							id="filter-drawer-transmission"
							value={draftFilters.transmission ?? ""}
							onChange={(e) =>
								handleChange({ transmission: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allTransmissions}</option>
							<option value="automatic">{t.listing.automatic}</option>
							<option value="manual">{t.listing.manual}</option>
						</NativeSelect>
					</div>

					{/* Fuel Type */}
					<div className="space-y-1.5">
						<label
							htmlFor="filter-drawer-fuel"
							className="text-xs font-semibold text-foreground"
						>
							{t.search.fuelType}
						</label>
						<NativeSelect
							id="filter-drawer-fuel"
							value={draftFilters.fuelType ?? ""}
							onChange={(e) =>
								handleChange({ fuelType: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allFuelTypes}</option>
							<option value="petrol">{t.listing.petrol}</option>
							<option value="diesel">{t.listing.diesel}</option>
							<option value="hybrid">{t.listing.hybrid}</option>
							<option value="electric">{t.listing.electric}</option>
						</NativeSelect>
					</div>
				</div>

				{/* Fixed Bottom Action Bar */}
				<div className="p-4 border-t border-border bg-card flex items-center gap-3">
					<Button
						variant="outline"
						onClick={handleClear}
						className="flex-1 h-11 text-xs font-semibold rounded-lg"
					>
						{t.filters.clearAll}
					</Button>
					<Button
						onClick={handleApply}
						className="flex-1 h-11 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
					>
						<SlidersHorizontal className="size-4" />
						{t.search.applyFilters}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
