import {
	AlertCircle,
	Check,
	ChevronRight,
	Crosshair,
	MapPin,
	Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";

export type SelectedLocation = {
	cityId?: string;
	cityName: string;
	districtId?: string;
	districtName?: string;
	lat?: number;
	lng?: number;
};

// Standard Sudanese cities matching seed database
const POPULAR_CITIES = [
	{
		id: "city-khartoum",
		nameEn: "Khartoum",
		nameAr: "الخرطوم",
		lat: 15.5007,
		lng: 32.5599,
	},
	{
		id: "city-omdurman",
		nameEn: "Omdurman",
		nameAr: "أم درمان",
		lat: 15.6505,
		lng: 32.4809,
	},
	{
		id: "city-bahri",
		nameEn: "Bahri",
		nameAr: "بحري",
		lat: 15.6458,
		lng: 32.5355,
	},
	{
		id: "city-portsudan",
		nameEn: "Port Sudan",
		nameAr: "بورتسودان",
		lat: 19.6158,
		lng: 37.2164,
	},
	{
		id: "city-wadmadani",
		nameEn: "Wad Madani",
		nameAr: "ود مدني",
		lat: 14.4012,
		lng: 33.5199,
	},
	{
		id: "city-kassala",
		nameEn: "Kassala",
		nameAr: "كسلا",
		lat: 15.451,
		lng: 36.4001,
	},
	{
		id: "city-elobeid",
		nameEn: "El Obeid",
		nameAr: "الأبيض",
		lat: 13.1843,
		lng: 30.2167,
	},
	{
		id: "city-nyala",
		nameEn: "Nyala",
		nameAr: "نيالا",
		lat: 12.0467,
		lng: 24.8922,
	},
];

const DISTRICTS_SAMPLE: Record<
	string,
	{ id: string; nameEn: string; nameAr: string }[]
> = {
	"city-khartoum": [
		{ id: "dist-amarat", nameEn: "Al Amarat", nameAr: "العمارات" },
		{ id: "dist-riyadh", nameEn: "Al Riyadh", nameAr: "الرياض" },
		{ id: "dist-khartoum2", nameEn: "Khartoum 2", nameAr: "الخرطوم 2" },
		{ id: "dist-manshiya", nameEn: "Al Manshiya", nameAr: "المنشية" },
		{ id: "dist-safa", nameEn: "Al Safa", nameAr: "الصفاء" },
	],
	"city-omdurman": [
		{ id: "dist-thawra", nameEn: "Al Thawra", nameAr: "الثورة" },
		{ id: "dist-mulazmeen", nameEn: "Al Mulazmeen", nameAr: "الملازمين" },
		{ id: "dist-muhandiseen", nameEn: "Al Muhandiseen", nameAr: "المهندسين" },
	],
	"city-bahri": [
		{ id: "dist-shambat", nameEn: "Shambat", nameAr: "شمبات" },
		{ id: "dist-halfaya", nameEn: "Al Halfaya", nameAr: "الحلفايا" },
		{ id: "dist-safia", nameEn: "Al Safia", nameAr: "الصافية" },
	],
};

type LocationSelectorModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialLocation?: SelectedLocation | null;
	onSelectLocation: (loc: SelectedLocation | null) => void;
};

export function LocationSelectorModal({
	open,
	onOpenChange,
	initialLocation,
	onSelectLocation,
}: LocationSelectorModalProps) {
	const { locale, dir } = useTranslation();
	const [search, setSearch] = useState("");
	const [selectedCity, setSelectedCity] = useState<{
		id: string;
		nameEn: string;
		nameAr: string;
	} | null>(
		initialLocation
			? POPULAR_CITIES.find(
					(c) =>
						c.nameEn === initialLocation.cityName ||
						c.id === initialLocation.cityId,
				) || null
			: null,
	);
	const [selectedDistrict, setSelectedDistrict] = useState<{
		id: string;
		nameEn: string;
		nameAr: string;
	} | null>(
		initialLocation?.districtName
			? {
					id: initialLocation.districtId || "",
					nameEn: initialLocation.districtName,
					nameAr: initialLocation.districtName,
				}
			: null,
	);
	const [geoLoading, setGeoLoading] = useState(false);
	const [geoError, setGeoError] = useState<string | null>(null);

	// Filter cities by search term
	const filteredCities = POPULAR_CITIES.filter((c) => {
		const name = locale === "ar" ? c.nameAr : c.nameEn;
		return name.toLowerCase().includes(search.toLowerCase());
	});

	// Handle HTML5 Geolocation API
	function handleCurrentLocation() {
		setGeoLoading(true);
		setGeoError(null);

		if (!("geolocation" in navigator)) {
			setGeoError("Geolocation is not supported by your browser");
			setGeoLoading(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(_pos) => {
				setGeoLoading(false);
				// Default to nearest major city (Khartoum)
				const khartoum = POPULAR_CITIES[0];
				setSelectedCity(khartoum);
				setSelectedDistrict(null);
			},
			(err) => {
				setGeoLoading(false);
				setGeoError(err.message || "Location access denied.");
			},
			{ timeout: 10000, enableHighAccuracy: false },
		);
	}

	function handleConfirm() {
		if (!selectedCity) {
			onSelectLocation(null);
		} else {
			onSelectLocation({
				cityId: selectedCity.id,
				cityName: locale === "ar" ? selectedCity.nameAr : selectedCity.nameEn,
				districtId: selectedDistrict?.id,
				districtName: selectedDistrict
					? locale === "ar"
						? selectedDistrict.nameAr
						: selectedDistrict.nameEn
					: undefined,
			});
		}
		onOpenChange(false);
	}

	function handleClear() {
		setSelectedCity(null);
		setSelectedDistrict(null);
		setSearch("");
		setGeoError(null);
	}

	const districts = selectedCity ? DISTRICTS_SAMPLE[selectedCity.id] || [] : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl border border-border">
				<DialogHeader className="px-6 pt-6 pb-2 text-start">
					<DialogTitle className="font-heading text-xl font-bold">
						{locale === "ar" ? "اختر الموقع" : "Select Location"}
					</DialogTitle>
				</DialogHeader>

				<div className="px-6 space-y-4 max-h-[75vh] overflow-y-auto pb-6">
					{/* Currently Selected Chip */}
					{selectedCity && (
						<div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
							<div className="flex items-center gap-2">
								<MapPin className="size-4 text-primary shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground">
										{locale === "ar" ? "الموقع المختار" : "Selected Location"}
									</p>
									<p className="text-sm font-semibold text-foreground">
										{locale === "ar"
											? selectedCity.nameAr
											: selectedCity.nameEn}
										{selectedDistrict &&
											` - ${locale === "ar" ? selectedDistrict.nameAr : selectedDistrict.nameEn}`}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClear}
								className="text-xs text-muted-foreground hover:text-foreground h-7"
							>
								{locale === "ar" ? "إلغاء التحديد" : "Clear Selection"}
							</Button>
						</div>
					)}

					{/* Geolocation Button */}
					<Button
						variant="outline"
						onClick={handleCurrentLocation}
						disabled={geoLoading}
						className="w-full justify-between h-12 px-4 font-medium border-border"
					>
						<div className="flex items-center gap-3">
							<Crosshair className="size-4 text-primary shrink-0" />
							<span>
								{locale === "ar"
									? "استخدام موقعي الحالي"
									: "Use My Current Location"}
							</span>
						</div>
						<ChevronRight className="size-4 text-muted-foreground" />
					</Button>

					{geoError && (
						<div className="flex items-center gap-2 p-3 text-xs text-amber-700 bg-amber-50 rounded-md">
							<AlertCircle className="size-4 shrink-0" />
							<span>{geoError}</span>
						</div>
					)}

					{/* Search input */}
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={
								locale === "ar"
									? "ابحث عن الخرطوم، أم درمان، بحري..."
									: "Search Khartoum, Omdurman, Bahri..."
							}
							className="ps-9"
						/>
					</div>

					{/* Cities List */}
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{locale === "ar" ? "المدن في السودان" : "Popular in Sudan"}
						</p>

						<div className="grid grid-cols-2 gap-2">
							{filteredCities.map((city) => {
								const isSelected = selectedCity?.id === city.id;
								return (
									<button
										key={city.id}
										type="button"
										onClick={() => {
											setSelectedCity(city);
											setSelectedDistrict(null);
										}}
										className={`flex items-center justify-between p-3 rounded-lg border text-start text-sm transition-colors ${
											isSelected
												? "border-primary bg-primary/10 text-primary font-semibold"
												: "border-border hover:bg-muted/60 text-foreground"
										}`}
									>
										<span>{locale === "ar" ? city.nameAr : city.nameEn}</span>
										{isSelected && <Check className="size-4 text-primary" />}
									</button>
								);
							})}
						</div>
					</div>

					{/* Districts (if city selected) */}
					{selectedCity && districts.length > 0 && (
						<div className="space-y-2 pt-2 border-t border-border/60">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{locale === "ar"
									? "الأحياء السكنية"
									: "District / Neighborhood"}
							</p>

							<div className="flex flex-wrap gap-2">
								{districts.map((district) => {
									const isDistSelected = selectedDistrict?.id === district.id;
									return (
										<Button
											key={district.id}
											variant={isDistSelected ? "default" : "outline"}
											size="sm"
											onClick={() =>
												setSelectedDistrict(isDistSelected ? null : district)
											}
											className="text-xs h-8"
										>
											{locale === "ar" ? district.nameAr : district.nameEn}
										</Button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer Actions */}
				<div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-muted/20">
					<Button variant="outline" onClick={handleClear} className="w-1/3">
						{locale === "ar" ? "مسح" : "Clear"}
					</Button>
					<Button onClick={handleConfirm} className="w-2/3">
						{locale === "ar" ? "تأكيد الموقع" : "Confirm Location"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
