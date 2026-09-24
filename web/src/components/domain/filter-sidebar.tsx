import { MapPin, X } from "lucide-react";
import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";
import type { ListingFilters } from "@/lib/query-keys";

type FilterSidebarProps = {
	filters: ListingFilters & {
		q?: string;
		vehicleType?: string;
		sellerType?: string;
		cityName?: string;
		districtName?: string;
	};
	onFilterChange: (
		updates: Partial<
			ListingFilters & { q?: string; vehicleType?: string; sellerType?: string }
		>,
	) => void;
	onReset: () => void;
	onApply: () => void;
	onOpenLocationModal: () => void;
	className?: string;
};

export function FilterSidebar({
	filters,
	onFilterChange,
	onReset,
	onApply,
	onOpenLocationModal,
	className,
}: FilterSidebarProps) {
	const { t, locale } = useTranslation();
	const [showMoreTypes, setShowMoreTypes] = useState(false);

	const vehicleTypes = [
		{ id: "cars", label: t.search.cars, count: 1842 },
		{ id: "suvs", label: t.search.suvs, count: 1256 },
		{ id: "pickup", label: t.search.pickupTrucks, count: 892 },
		{ id: "hatchback", label: t.search.hatchbacks, count: 512 },
		{ id: "van", label: t.search.vansBuses, count: 245 },
		{ id: "tuktuk", label: t.search.tuktuks, count: 180 },
		{ id: "motorcycle", label: t.search.motorcycles, count: 95 },
		{ id: "heavy", label: t.search.heavyEquipment, count: 42 },
	];

	const visibleVehicleTypes = showMoreTypes
		? vehicleTypes
		: vehicleTypes.slice(0, 5);

	const fuelTypes = [
		{ id: "petrol", label: t.listing.petrol },
		{ id: "diesel", label: t.listing.diesel },
		{ id: "hybrid", label: t.listing.hybrid },
		{ id: "electric", label: t.listing.electric },
	];

	const transmissionOptions = [
		{ id: "automatic", label: t.listing.automatic },
		{ id: "manual", label: t.listing.manual },
	];

	const conditionOptions = [
		{ id: "new", label: t.listing.newListing },
		{
			id: "used_excellent",
			label: locale === "ar" ? "مستعمل - ممتاز" : "Used - Excellent",
		},
		{
			id: "used_good",
			label: locale === "ar" ? "مستعمل - جيد" : "Used - Good",
		},
		{
			id: "used_fair",
			label: locale === "ar" ? "مستعمل - مقبول" : "Used - Fair",
		},
	];

	const sellerTypes = [
		{ id: "individual", label: t.search.individual },
		{ id: "verified", label: t.search.verifiedSeller },
		{ id: "dealer", label: t.search.dealer },
	];

	return (
		<aside
			className={`w-72 shrink-0 space-y-6 rounded-lg border border-border bg-card p-5 ${className ?? ""}`}
		>
			{/* Top Header */}
			<div className="flex items-center justify-between border-b border-border pb-4">
				<h3 className="font-heading text-base font-bold text-foreground">
					{t.filters.filters}
				</h3>
				<button
					type="button"
					onClick={onReset}
					className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
				>
					{t.filters.clearAll}
				</button>
			</div>

			<Accordion
				type="multiple"
				defaultValue={[
					"location",
					"category",
					"vehicleType",
					"price",
					"year",
					"mileage",
					"fuelType",
					"transmission",
					"condition",
					"sellerType",
				]}
				className="border-0 divide-y divide-border"
			>
				{/* 1. Location Section */}
				<AccordionItem value="location" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.listing.city}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2.5">
						{filters.cityName ? (
							<Badge
								variant="secondary"
								className="flex items-center justify-between w-full py-1.5 px-3 text-xs bg-primary/10 text-primary border border-primary/20"
							>
								<span className="flex items-center gap-1.5 truncate">
									<MapPin className="size-3.5 shrink-0" />
									{filters.cityName}
									{filters.districtName ? `, ${filters.districtName}` : ""}
								</span>
								<button
									type="button"
									onClick={() =>
										onFilterChange({
											cityId: undefined,
											districtId: undefined,
											cityName: undefined,
											districtName: undefined,
										})
									}
									className="size-4 hover:bg-black/10 rounded-full inline-flex items-center justify-center"
								>
									<X className="size-3" />
								</button>
							</Badge>
						) : (
							<button
								type="button"
								onClick={onOpenLocationModal}
								className="flex items-center justify-between w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
							>
								<span className="flex items-center gap-1.5">
									<MapPin className="size-3.5 text-muted-foreground" />
									{locale === "ar"
										? "اختر المدينة / الحي"
										: "Select City / District"}
								</span>
								<span className="text-primary font-medium">
									{t.search.changeLocation}
								</span>
							</button>
						)}

						{/* District Dropdown Selector */}
						<NativeSelect
							value={filters.districtId ?? ""}
							onChange={(e) =>
								onFilterChange({ districtId: e.target.value || undefined })
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
						</NativeSelect>
					</AccordionContent>
				</AccordionItem>

				{/* 2. Category Section */}
				<AccordionItem value="category" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.listing.category}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2.5">
						<NativeSelect
							value={filters.categoryId ?? ""}
							onChange={(e) =>
								onFilterChange({ categoryId: e.target.value || undefined })
							}
							className="w-full"
						>
							<option value="">{t.search.allCategories}</option>
							<option value="cat-sedan">
								{locale === "ar" ? "سيارات سيدان" : "Sedan Cars"}
							</option>
							<option value="cat-suv">
								{locale === "ar" ? "دفع رباعي وعائلي" : "SUVs & 4x4"}
							</option>
							<option value="cat-pickup">
								{locale === "ar" ? "بك آب وشاحنات خفيفة" : "Pickups & Trucks"}
							</option>
							<option value="cat-van">
								{locale === "ar" ? "فانات وباصات" : "Vans & Buses"}
							</option>
							<option value="cat-tuktuk">
								{locale === "ar" ? "ركشات وتوك توك" : "Tuk-Tuks"}
							</option>
							<option value="cat-motorcycle">
								{locale === "ar" ? "دراجات نارية" : "Motorcycles"}
							</option>
							<option value="cat-spare-parts">
								{locale === "ar" ? "قطع غيار واكسسوارات" : "Spare Parts"}
							</option>
						</NativeSelect>
					</AccordionContent>
				</AccordionItem>

				{/* 3. Vehicle Type Checkbox List */}
				<AccordionItem value="vehicleType" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.vehicleType}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2.5">
						{visibleVehicleTypes.map((type) => {
							const checked = filters.vehicleType === type.id;
							return (
								<label
									key={type.id}
									className="flex items-center justify-between cursor-pointer text-xs group"
								>
									<div className="flex items-center gap-2">
										<Checkbox
											checked={checked}
											onCheckedChange={(val) =>
												onFilterChange({
													vehicleType: val ? type.id : undefined,
												})
											}
										/>
										<span className="text-foreground group-hover:text-primary transition-colors">
											{type.label}
										</span>
									</div>
									<span className="text-muted-foreground text-[11px] tabular-nums">
										{type.count.toLocaleString()}
									</span>
								</label>
							);
						})}

						<button
							type="button"
							onClick={() => setShowMoreTypes(!showMoreTypes)}
							className="text-xs font-semibold text-primary hover:underline pt-1"
						>
							{showMoreTypes ? t.search.showLess : t.search.showMore}
						</button>
					</AccordionContent>
				</AccordionItem>

				{/* 4. Price (SDG) */}
				<AccordionItem value="price" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.priceSdg}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1">
						<div className="flex items-center gap-2">
							<Input
								type="number"
								placeholder={t.search.minPricePlaceholder}
								value={filters.minPrice ?? ""}
								onChange={(e) =>
									onFilterChange({
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
								type="number"
								placeholder={t.search.maxPricePlaceholder}
								value={filters.maxPrice ?? ""}
								onChange={(e) =>
									onFilterChange({
										maxPrice: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* 5. Year */}
				<AccordionItem value="year" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.year}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1">
						<div className="flex items-center gap-2">
							<Input
								type="number"
								placeholder={t.search.minYearPlaceholder}
								value={filters.minYear ?? ""}
								onChange={(e) =>
									onFilterChange({
										minYear: e.target.value
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
								type="number"
								placeholder={t.search.maxYearPlaceholder}
								value={filters.maxYear ?? ""}
								onChange={(e) =>
									onFilterChange({
										maxYear: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* 6. Mileage (km) */}
				<AccordionItem value="mileage" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.mileageKm}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1">
						<div className="space-y-3">
							<div className="flex flex-wrap gap-1.5">
								{[30000, 60000, 100000, 150000].map((km) => (
									<button
										key={km}
										type="button"
										onClick={() => onFilterChange({ maxMileage: km })}
										className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
											filters.maxMileage === km
												? "bg-primary text-primary-foreground border-primary"
												: "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
										}`}
									>
										&lt; {(km / 1000).toFixed(0)}k km
									</button>
								))}
							</div>
							<Input
								type="number"
								placeholder={
									locale === "ar" ? "أقصى مسافة (كم)" : "Max Mileage (km)"
								}
								value={filters.maxMileage ?? ""}
								onChange={(e) =>
									onFilterChange({
										maxMileage: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* 7. Fuel Type */}
				<AccordionItem value="fuelType" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.fuelType}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2">
						{fuelTypes.map((fuel) => (
							<label
								key={fuel.id}
								className="flex items-center gap-2 cursor-pointer text-xs"
							>
								<Checkbox
									checked={filters.fuelType === fuel.id}
									onCheckedChange={(val) =>
										onFilterChange({
											fuelType: val ? fuel.id : undefined,
										})
									}
								/>
								<span className="text-foreground">{fuel.label}</span>
							</label>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* 8. Transmission */}
				<AccordionItem value="transmission" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.transmission}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2">
						{transmissionOptions.map((trans) => (
							<label
								key={trans.id}
								className="flex items-center gap-2 cursor-pointer text-xs"
							>
								<Checkbox
									checked={filters.transmission === trans.id}
									onCheckedChange={(val) =>
										onFilterChange({
											transmission: val ? trans.id : undefined,
										})
									}
								/>
								<span className="text-foreground">{trans.label}</span>
							</label>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* 9. Condition */}
				<AccordionItem value="condition" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.condition}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2">
						{conditionOptions.map((cond) => (
							<label
								key={cond.id}
								className="flex items-center gap-2 cursor-pointer text-xs"
							>
								<Checkbox
									checked={filters.condition === cond.id}
									onCheckedChange={(val) =>
										onFilterChange({
											condition: val ? cond.id : undefined,
										})
									}
								/>
								<span className="text-foreground">{cond.label}</span>
							</label>
						))}
					</AccordionContent>
				</AccordionItem>

				{/* 10. Seller Type */}
				<AccordionItem value="sellerType" className="border-b-0 py-1">
					<AccordionTrigger className="text-sm font-semibold text-foreground py-2 hover:no-underline">
						<span>{t.search.sellerType}</span>
					</AccordionTrigger>
					<AccordionContent className="pt-2 pb-1 space-y-2">
						{sellerTypes.map((seller) => (
							<label
								key={seller.id}
								className="flex items-center gap-2 cursor-pointer text-xs"
							>
								<Checkbox
									checked={filters.sellerType === seller.id}
									onCheckedChange={(val) =>
										onFilterChange({
											sellerType: val ? seller.id : undefined,
										})
									}
								/>
								<span className="text-foreground">{seller.label}</span>
							</label>
						))}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* Actions */}
			<div className="pt-4 border-t border-border flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={onReset}
					className="flex-1 text-xs h-9"
				>
					{t.search.reset}
				</Button>
				<Button
					size="sm"
					onClick={onApply}
					className="flex-1 text-xs h-9 font-semibold bg-primary hover:bg-primary/90"
				>
					{t.search.applyFilters}
				</Button>
			</div>
		</aside>
	);
}
