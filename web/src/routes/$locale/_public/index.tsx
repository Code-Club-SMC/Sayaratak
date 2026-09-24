import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Building2,
	Car,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	Globe,
	Headphones,
	Key,
	ShieldCheck,
	SlidersHorizontal,
	Star,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import {
	ListingCard,
	type ListingCardData,
} from "@/components/domain/listing-card";
import {
	LocationSelectorModal,
	type SelectedLocation,
} from "@/components/domain/location-selector-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_public/")({
	component: HomePage,
});

// Seed data matching SCR-001 Featured Vehicles
const FEATURED_LISTINGS: ListingCardData[] = [
	{
		id: "feat-1",
		title: "Toyota Land Cruiser 2020",
		trim: "GXR V6 4.0L",
		price: 125000000,
		currency: "SDG",
		year: 2020,
		mileage: 60000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		city: "Khartoum",
		district: "Al Riyadh",
		isFeatured: true,
		images: ["/images/cars/land-cruiser-2020.png"],
		seller: {
			name: "Al Fajer Motors",
			isVerified: true,
			accountType: "dealership",
		},
	},
	{
		id: "feat-2",
		title: "Hyundai Elantra 2021",
		trim: "Smart Plus",
		price: 58500000,
		currency: "SDG",
		year: 2021,
		mileage: 45000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		city: "Khartoum",
		district: "Al Amarat",
		isFeatured: true,
		images: ["/images/cars/elantra-2021.png"],
		seller: {
			name: "Central Motors",
			isVerified: true,
			accountType: "dealership",
		},
	},
	{
		id: "feat-3",
		title: "Kia Sportage 2021",
		trim: "EX AWD",
		price: 72500000,
		currency: "SDG",
		year: 2021,
		mileage: 36000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		city: "Khartoum",
		district: "Al Manshiya",
		isFeatured: true,
		images: ["/images/cars/sportage-2021.png"],
		seller: {
			name: "Auto One",
			isVerified: true,
			accountType: "dealership",
		},
	},
	{
		id: "feat-4",
		title: "Toyota Hilux 2020",
		trim: "Double Cabin 2.7L 4x4",
		price: 48000000,
		currency: "SDG",
		year: 2020,
		mileage: 55000,
		transmission: "manual",
		fuelType: "petrol",
		condition: "used",
		city: "Omdurman",
		district: "Al Thawra",
		isFeatured: true,
		images: ["/images/cars/hilux-2020.png"],
		seller: {
			name: "Sudan Auto",
			isVerified: true,
			accountType: "dealership",
		},
	},
];

// Seed data matching SCR-001 Latest Vehicles
const LATEST_LISTINGS: ListingCardData[] = [
	{
		id: "latest-1",
		title: "Nissan Sunny 2022",
		trim: "1.6L Comfort",
		price: 36000000,
		currency: "SDG",
		year: 2022,
		mileage: 40000,
		transmission: "automatic",
		city: "Khartoum",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Ahmed Motors", isVerified: false },
	},
	{
		id: "latest-2",
		title: "Chevrolet Captiva 2021",
		trim: "Premier 1.5L Turbo",
		price: 62000000,
		currency: "SDG",
		year: 2021,
		mileage: 32000,
		transmission: "automatic",
		city: "Khartoum",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Al Sahafa Cars", isVerified: true },
	},
	{
		id: "latest-3",
		title: "MG 5 2022",
		trim: "Luxury 1.5L",
		price: 34500000,
		currency: "SDG",
		year: 2022,
		mileage: 16500,
		transmission: "automatic",
		city: "Khartoum",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Blue Nile Motors", isVerified: true },
	},
	{
		id: "latest-4",
		title: "Mitsubishi L200 2021",
		trim: "GLX 4x4",
		price: 52600000,
		currency: "SDG",
		year: 2021,
		mileage: 48000,
		transmission: "manual",
		city: "Port Sudan",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Red Sea Cars", isVerified: false },
	},
	{
		id: "latest-5",
		title: "Kia Pegas 2023",
		trim: "Standard 1.4L",
		price: 28000000,
		currency: "SDG",
		year: 2023,
		mileage: 19000,
		transmission: "automatic",
		city: "Khartoum",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Al Amal Motors", isVerified: true },
	},
	{
		id: "latest-6",
		title: "Toyota Fortuner 2020",
		trim: "GXR 2.7L",
		price: 64000000,
		currency: "SDG",
		year: 2020,
		mileage: 50000,
		transmission: "automatic",
		city: "Khartoum",
		isNew: true,
		images: ["/images/placeholders/car-placeholder.svg"],
		seller: { name: "Elite Cars", isVerified: true },
	},
];

// 8 Vehicle Categories matching SCR-001
const VEHICLE_CATEGORIES = [
	{
		id: "sedan",
		nameEn: "Sedan",
		nameAr: "سيدان",
		count: "1,842",
		icon: "/images/categories/sedan.svg",
	},
	{
		id: "suv",
		nameEn: "SUV",
		nameAr: "دفع رباعي",
		count: "12,966",
		icon: "/images/categories/suv.svg",
	},
	{
		id: "pickup",
		nameEn: "Pickup",
		nameAr: "بيك أب",
		count: "892",
		icon: "/images/categories/pickup.svg",
	},
	{
		id: "hatchback",
		nameEn: "Hatchback",
		nameAr: "هاتشباك",
		count: "512",
		icon: "/images/categories/hatchback.svg",
	},
	{
		id: "luxury",
		nameEn: "Luxury",
		nameAr: "فاخرة",
		count: "372",
		icon: "/images/categories/luxury.svg",
	},
	{
		id: "van",
		nameEn: "Van & Bus",
		nameAr: "فان وباص",
		count: "245",
		icon: "/images/categories/van.svg",
	},
	{
		id: "truck",
		nameEn: "Trucks",
		nameAr: "شاحنات",
		count: "198",
		icon: "/images/categories/truck.svg",
	},
	{
		id: "all",
		nameEn: "View All",
		nameAr: "عرض الكل",
		count: "2,658",
		icon: null,
	},
];

// Cities Near You matching SCR-001
const POPULAR_CITIES_NEAR = [
	{
		nameEn: "Khartoum",
		nameAr: "الخرطوم",
		count: "1,264",
		image: "/images/cities/khartoum.png",
	},
	{
		nameEn: "Omdurman",
		nameAr: "أم درمان",
		count: "892",
		image: "/images/cities/omdurman.png",
	},
	{
		nameEn: "Bahri",
		nameAr: "بحري",
		count: "642",
		image: "/images/cities/bahri.png",
	},
	{
		nameEn: "Port Sudan",
		nameAr: "بورتسودان",
		count: "318",
		image: "/images/cities/port-sudan.png",
	},
	{
		nameEn: "Kassala",
		nameAr: "كسلا",
		count: "276",
		image: "/images/cities/kassala.png",
	},
	{
		nameEn: "Al Qadarif",
		nameAr: "القضارف",
		count: "221",
		image: "/images/cities/al-qadarif.png",
	},
];

// Top Dealerships matching SCR-001
const FEATURED_DEALERSHIPS = [
	{
		name: "Toyota Sudan Motors",
		city: "Khartoum",
		rating: 4.7,
		reviews: 128,
		inventory: 126,
		verified: true,
		logo: "/custom-svgs/dealership.svg",
	},
	{
		name: "Al-Fateh Hyundai",
		city: "Omdurman",
		rating: 4.6,
		reviews: 96,
		inventory: 98,
		verified: true,
		logo: "/custom-svgs/dealership.svg",
	},
	{
		name: "Nissan Bahri Motors",
		city: "Bahri",
		rating: 4.5,
		reviews: 72,
		inventory: 74,
		verified: true,
		logo: "/custom-svgs/dealership.svg",
	},
	{
		name: "Kia Motors Sudan",
		city: "Khartoum",
		rating: 4.6,
		reviews: 64,
		inventory: 61,
		verified: true,
		logo: "/custom-svgs/dealership.svg",
	},
];

// Top Workshops matching SCR-001
const FEATURED_WORKSHOPS = [
	{
		name: "Profis Auto Care",
		city: "Khartoum",
		rating: 4.6,
		reviews: 106,
		category: "Full Service & Diagnostics",
		logo: "/custom-svgs/workshop.svg",
	},
	{
		name: "Turbo Service",
		city: "Omdurman",
		rating: 4.5,
		reviews: 92,
		category: "Engine & Transmission",
		logo: "/custom-svgs/workshop.svg",
	},
	{
		name: "Al Muta Auto",
		city: "Khartoum",
		rating: 4.7,
		reviews: 110,
		category: "Electrical & AC Repair",
		logo: "/custom-svgs/workshop.svg",
	},
	{
		name: "Speedy Motors",
		city: "Bahri",
		rating: 4.4,
		reviews: 76,
		category: "Brakes & Suspension",
		logo: "/custom-svgs/workshop.svg",
	},
];

function HomePage() {
	const { t, locale, dir } = useTranslation();
	const navigate = useNavigate();

	// Hero Search State
	const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedPrice, setSelectedPrice] = useState("all");
	const [selectedYear, setSelectedYear] = useState("all");
	const [locationModalOpen, setLocationModalOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] =
		useState<SelectedLocation | null>(null);

	function handleSearchSubmit(e: React.FormEvent) {
		e.preventDefault();

		let minPrice: number | undefined;
		let maxPrice: number | undefined;
		if (selectedPrice === "0-50m") {
			maxPrice = 50000000;
		} else if (selectedPrice === "50m-100m") {
			minPrice = 50000000;
			maxPrice = 100000000;
		} else if (selectedPrice === "100m+") {
			minPrice = 100000000;
		}

		navigate({
			to: "/$locale/listings",
			params: { locale },
			search: {
				vehicleType: selectedCategory !== "all" ? selectedCategory : undefined,
				cityId: selectedLocation?.cityId,
				minYear: selectedYear !== "all" ? Number(selectedYear) : undefined,
				minPrice,
				maxPrice,
			},
		});
	}

	function handlePopularSearch(term: string) {
		navigate({
			to: "/$locale/listings",
			params: { locale },
			search: {
				q: term,
			},
		});
	}

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			{/* ── 1. HERO SECTION ────────────────────────────────────────── */}
			<section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
				{/* Background Image & Overlay */}
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: "url('/images/hero/hero-bg.jpg.png')" }}
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />

				<div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
					<div className="max-w-2xl text-start">
						<h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
							{t.home.heroHeadline}
						</h1>
						<p className="mt-6 text-lg sm:text-xl text-slate-200 leading-relaxed max-w-lg">
							{t.home.heroSubtitle}
						</p>

						{/* Tabbed Hero Search Box */}
						<div className="mt-10 overflow-hidden rounded-xl border border-white/20 bg-background/95 shadow-2xl text-start w-full max-w-3xl">
							{/* Buy vs Rent Tabs */}
							<div className="border-b border-border">
								<Tabs
									value={activeTab}
									onValueChange={(v) => setActiveTab(v as "buy" | "rent")}
									className="w-full"
								>
									<TabsList className="w-full justify-start rounded-none bg-muted/50 p-0 h-12">
										<TabsTrigger
											value="buy"
											className="gap-2 font-semibold px-8 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
										>
											<Car className="size-4" />
											<span>{t.home.buy}</span>
										</TabsTrigger>
										<TabsTrigger
											value="rent"
											className="gap-2 font-semibold px-8 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
										>
											<Key className="size-4" />
											<span>{t.home.rent}</span>
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							{/* Search Form Fields */}
							<form
								onSubmit={handleSearchSubmit}
								className="p-4 sm:p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
							>
								{/* Category / Make */}
								<div className="space-y-1.5 lg:col-span-1">
									<label className="text-xs font-semibold text-muted-foreground px-1">
										{t.home.allCategories}
									</label>
									<NativeSelect
										value={selectedCategory}
										onChange={(e) => setSelectedCategory(e.target.value)}
										className="w-full [&_select]:h-11 [&_select]:text-sm [&_select]:border-none [&_select]:bg-muted/50 [&_select]:font-medium"
									>
										<option value="all">{t.home.allCategories}</option>
										<option value="cars">{t.common.cars}</option>
										<option value="pickup">
											{locale === "ar" ? "شاحنات وبك آب" : "Trucks & Pickups"}
										</option>
										<option value="tuktuk">
											{locale === "ar"
												? "ركشات وتوك توك"
												: "Tuk-Tuks & Rickshaws"}
										</option>
										<option value="spare-parts">
											{locale === "ar" ? "قطع غيار" : "Spare Parts"}
										</option>
									</NativeSelect>
								</div>

								{/* Location selector trigger */}
								<div className="space-y-1.5 lg:col-span-1">
									<label className="text-xs font-semibold text-muted-foreground px-1">
										{t.home.location}
									</label>
									<button
										type="button"
										onClick={() => setLocationModalOpen(true)}
										className="flex h-11 w-full items-center justify-between rounded-md bg-muted/50 px-3 text-sm font-medium text-start hover:bg-muted transition-colors"
									>
										<div className="flex items-center gap-2 truncate">
											<span className="truncate">
												{selectedLocation
													? selectedLocation.cityName
													: t.home.allSudan}
											</span>
										</div>
										<ChevronDown className="size-4 text-muted-foreground shrink-0" />
									</button>
								</div>

								{/* Price Range */}
								<div className="space-y-1.5 lg:col-span-1">
									<label className="text-xs font-semibold text-muted-foreground px-1">
										{t.home.priceRange}
									</label>
									<NativeSelect
										value={selectedPrice}
										onChange={(e) => setSelectedPrice(e.target.value)}
										className="w-full [&_select]:h-11 [&_select]:text-sm [&_select]:border-none [&_select]:bg-muted/50 [&_select]:font-medium"
									>
										<option value="all">{t.home.minMax}</option>
										<option value="0-50m">
											{locale === "ar" ? "حتى 50 مليون ج.س" : "Up to 50M SDG"}
										</option>
										<option value="50m-100m">
											{locale === "ar"
												? "50 - 100 مليون ج.س"
												: "50M - 100M SDG"}
										</option>
										<option value="100m+">
											{locale === "ar" ? "أكثر من 100 مليون ج.س" : "100M+ SDG"}
										</option>
									</NativeSelect>
								</div>

								{/* Year */}
								<div className="space-y-1.5 lg:col-span-1">
									<label className="text-xs font-semibold text-muted-foreground px-1">
										{t.home.year}
									</label>
									<NativeSelect
										value={selectedYear}
										onChange={(e) => setSelectedYear(e.target.value)}
										className="w-full [&_select]:h-11 [&_select]:text-sm [&_select]:border-none [&_select]:bg-muted/50 [&_select]:font-medium"
									>
										<option value="all">{t.home.anyYear}</option>
										<option value="2023">2023+</option>
										<option value="2020">2020+</option>
										<option value="2015">2015+</option>
									</NativeSelect>
								</div>

								{/* Submit Button */}
								<div className="flex items-end lg:col-span-1">
									<Button
										type="submit"
										size="lg"
										className="w-full h-11 gap-2 font-bold shadow-md bg-blue-600 hover:bg-blue-700 text-white"
									>
										<span>{t.common.search}</span>
									</Button>
								</div>
							</form>

							{/* Popular Searches Row */}
							<div className="bg-muted/30 px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-t border-border">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-xs font-bold text-foreground">
										{t.home.popularSearches}:
									</span>
									{[
										"Toyota Land Cruiser",
										"Hyundai Elantra",
										"Kia Sportage",
										"Pickup",
										"Camry",
									].map((tag) => (
										<button
											key={tag}
											type="button"
											onClick={() => handlePopularSearch(tag)}
											className="text-xs font-semibold text-primary hover:underline transition-colors"
										>
											{tag}
										</button>
									))}
								</div>

								<Button
									variant="link"
									size="sm"
									className="h-auto p-0 text-xs font-bold text-primary gap-1.5"
									asChild
								>
									<Link to="/$locale/listings" params={{ locale }}>
										<SlidersHorizontal className="size-3.5" />
										<span>{t.home.advancedSearch}</span>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── 2. BROWSE BY VEHICLE TYPE GRID (8 ITEMS) ─────────────── */}
			<section className="border-b border-border bg-card/50 py-12">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="text-center sm:text-start mb-8">
						<h2 className="font-heading text-xl font-bold tracking-tight">
							{t.home.browseByType}
						</h2>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
						{VEHICLE_CATEGORIES.map((cat) => {
							const name = locale === "ar" ? cat.nameAr : cat.nameEn;
							return (
								<Link
									key={cat.id}
									to="/$locale/listings"
									params={{ locale }}
									search={{ vehicleType: cat.id }}
									className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-150 text-center"
								>
									<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
										{cat.icon ? (
											<img
												src={cat.icon}
												alt={name}
												className="size-6 text-primary"
											/>
										) : (
											<Car className="size-6 text-primary" />
										)}
									</div>
									<span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
										{name}
									</span>
									<span className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
										{cat.count} {locale === "ar" ? "إعلان" : "ads"}
									</span>
								</Link>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── 3. FEATURED LISTINGS ────────────────────────────────────── */}
			<section className="py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="font-heading text-2xl font-bold tracking-tight">
								{t.home.featuredListings}
							</h2>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" asChild>
								<Link
									to="/$locale/listings"
									params={{ locale }}
									className="gap-1 font-semibold text-primary"
								>
									<span>{t.common.seeAll}</span>
									{dir === "rtl" ? (
										<ChevronLeft className="size-4" />
									) : (
										<ChevronRight className="size-4" />
									)}
								</Link>
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{FEATURED_LISTINGS.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				</div>
			</section>

			{/* ── 4. LATEST LISTINGS ──────────────────────────────────────── */}
			<section className="border-t border-border bg-muted/20 py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between mb-8">
						<h2 className="font-heading text-2xl font-bold tracking-tight">
							{t.home.latestListings}
						</h2>

						<Button variant="ghost" size="sm" asChild>
							<Link
								to="/$locale/listings"
								params={{ locale }}
								className="gap-1 font-semibold text-primary"
							>
								<span>{t.common.seeAll}</span>
								{dir === "rtl" ? (
									<ChevronLeft className="size-4" />
								) : (
									<ChevronRight className="size-4" />
								)}
							</Link>
						</Button>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{LATEST_LISTINGS.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				</div>
			</section>

			{/* ── 5. LISTINGS NEAR YOU (CITY DISCOVERY) ─────────────────── */}
			<section className="py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between mb-8">
						<h2 className="font-heading text-2xl font-bold tracking-tight">
							{t.home.listingsNearYou}
						</h2>

						<Button variant="ghost" size="sm" asChild>
							<Link
								to="/$locale/listings"
								params={{ locale }}
								className="gap-1 font-semibold text-primary"
							>
								<span>{t.common.seeAll}</span>
								{dir === "rtl" ? (
									<ChevronLeft className="size-4" />
								) : (
									<ChevronRight className="size-4" />
								)}
							</Link>
						</Button>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
						{POPULAR_CITIES_NEAR.map((city) => {
							const name = locale === "ar" ? city.nameAr : city.nameEn;
							return (
								<Link
									key={city.nameEn}
									to="/$locale/listings"
									params={{ locale }}
									search={{ cityId: city.nameEn.toLowerCase() }}
									className="group relative overflow-hidden rounded-xl border border-border aspect-[4/3] flex flex-col justify-end p-4 transition-transform hover:scale-[1.02]"
								>
									{/* Background Image & Overlay */}
									<div
										className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
										style={{ backgroundImage: `url(${city.image})` }}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
									<div className="relative z-10 text-white">
										<p className="font-heading text-base font-bold leading-tight drop-shadow-sm">
											{name}
										</p>
										<p className="text-xs text-white/80 tabular-nums font-medium mt-0.5">
											{city.count} {locale === "ar" ? "إعلان" : "ads"}
										</p>
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── 6. THREE PROMOTIONAL VALUE CARDS ───────────────────────── */}
			<section className="border-t border-border bg-slate-50 dark:bg-slate-900/30 py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Card 1: Rentals */}
						<Card className="relative overflow-hidden p-6 flex flex-col justify-between border-border hover:border-primary/40 transition-colors bg-[#F4F7FB]">
							<div className="relative z-10 w-[60%] space-y-3">
								<h3 className="font-heading text-xl font-bold text-slate-900">
									{t.home.needRental}
								</h3>
								<p className="text-sm text-slate-600 leading-relaxed">
									{t.home.needRentalSubtitle}
								</p>
								<div className="pt-4">
									<Button
										className="font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md"
										asChild
									>
										<Link
											to="/$locale/listings"
											params={{ locale }}
											search={{ vehicleType: "rentals" }}
										>
											{t.home.exploreRentals}
										</Link>
									</Button>
								</div>
							</div>
							<img
								src="/images/promos/promo-rental.png"
								alt="Rental Car"
								className="absolute right-[-10%] bottom-[-5%] w-[55%] object-contain drop-shadow-xl"
								style={{
									transform: dir === "rtl" ? "scaleX(-1)" : "none",
									right: dir === "rtl" ? "auto" : undefined,
									left: dir === "rtl" ? "-10%" : undefined,
								}}
							/>
						</Card>

						{/* Card 2: Spare Parts */}
						<Card className="relative overflow-hidden p-6 flex flex-col justify-between border-border hover:border-primary/40 transition-colors bg-[#F0F5FF]">
							<div className="relative z-10 w-[60%] space-y-3">
								<h3 className="font-heading text-xl font-bold text-slate-900">
									{t.home.genuineParts}
								</h3>
								<p className="text-sm text-slate-600 leading-relaxed">
									{t.home.genuinePartsSubtitle}
								</p>
								<div className="pt-4">
									<Button
										className="font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md"
										asChild
									>
										<Link
											to="/$locale/listings"
											params={{ locale }}
											search={{ vehicleType: "spare-parts" }}
										>
											{t.home.shopParts}
										</Link>
									</Button>
								</div>
							</div>
							<img
								src="/images/promos/promo-parts.png"
								alt="Spare Parts"
								className="absolute right-[-5%] bottom-[5%] w-[45%] object-contain drop-shadow-xl"
								style={{
									right: dir === "rtl" ? "auto" : undefined,
									left: dir === "rtl" ? "-5%" : undefined,
								}}
							/>
						</Card>

						{/* Card 3: Post an Ad */}
						<Card className="relative overflow-hidden p-6 flex flex-col justify-between border-border hover:border-primary/40 transition-colors bg-[#E8F0FE]">
							<div className="relative z-10 w-[65%] space-y-3">
								<h3 className="font-heading text-xl font-bold text-slate-900">
									{t.home.postAdMinutes}
								</h3>
								<p className="text-sm text-slate-600 leading-relaxed">
									{t.home.postAdMinutesSubtitle}
								</p>
								<div className="pt-4">
									<Button
										className="font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md"
										asChild
									>
										<Link
											to="/$locale/dashboard/listings/new"
											params={{ locale }}
										>
											<span>{t.home.postYourAd}</span>
										</Link>
									</Button>
								</div>
							</div>
							<img
								src="/images/promos/promo-post-ad.png"
								alt="Mobile App"
								className="absolute right-2 bottom-[-10%] w-[35%] object-contain drop-shadow-xl"
								style={{
									right: dir === "rtl" ? "auto" : undefined,
									left: dir === "rtl" ? "8px" : undefined,
								}}
							/>
						</Card>
					</div>
				</div>
			</section>

			{/* ── 7. VERIFIED DEALERSHIPS & WORKSHOPS ─────────────────────── */}
			<section className="py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					{/* Dealerships */}
					<div className="mb-12">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading text-xl font-bold tracking-tight">
								{t.home.verifiedDealerships}
							</h2>
							<Button variant="ghost" size="sm" asChild>
								<Link
									to="/$locale/listings"
									params={{ locale }}
									search={{ sellerType: "dealer" }}
									className="gap-1 font-semibold text-primary"
								>
									<span>{t.common.seeAll}</span>
									{dir === "rtl" ? (
										<ChevronLeft className="size-4" />
									) : (
										<ChevronRight className="size-4" />
									)}
								</Link>
							</Button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{FEATURED_DEALERSHIPS.map((dealer) => (
								<Card
									key={dealer.name}
									className="p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-colors"
								>
									<div>
										<div className="flex items-start justify-between">
											<div className="size-12 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center p-1 font-bold">
												{dealer.logo ? (
													<img
														src={dealer.logo}
														alt={dealer.name}
														className="size-full object-contain"
													/>
												) : (
													<Building2 className="size-6 text-muted-foreground" />
												)}
											</div>
											{dealer.verified && (
												<Badge
													variant="secondary"
													className="gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border-emerald-200"
												>
													<CheckCircle2 className="size-3" />
													<span>{t.listing.verified}</span>
												</Badge>
											)}
										</div>
										<h4 className="font-heading text-base font-bold text-foreground mt-3">
											{dealer.name}
										</h4>
										<p className="text-xs text-muted-foreground">
											{dealer.city}
										</p>
										<div className="flex items-center gap-2 mt-2 text-xs">
											<div className="flex items-center text-amber-500 gap-1 font-semibold">
												<Star className="size-3.5 fill-amber-500" />
												<span>{dealer.rating}</span>
											</div>
											<span className="text-muted-foreground">
												({dealer.reviews})
											</span>
											<span className="text-muted-foreground">•</span>
											<span className="font-medium text-foreground">
												{dealer.inventory} {locale === "ar" ? "سيارة" : "cars"}
											</span>
										</div>
									</div>

									<div className="mt-4 pt-3 border-t border-border/50">
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs"
											asChild
										>
											<Link
												to="/$locale/listings"
												params={{ locale }}
												search={{ sellerType: "dealer" }}
											>
												{t.home.viewDealership}
											</Link>
										</Button>
									</div>
								</Card>
							))}
						</div>
					</div>

					{/* Workshops */}
					<div>
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading text-xl font-bold tracking-tight">
								{t.home.trustedWorkshops}
							</h2>
							<Button variant="ghost" size="sm" asChild>
								<Link
									to="/$locale/listings"
									params={{ locale }}
									search={{ sellerType: "workshop" }}
									className="gap-1 font-semibold text-primary"
								>
									<span>{t.common.seeAll}</span>
									{dir === "rtl" ? (
										<ChevronLeft className="size-4" />
									) : (
										<ChevronRight className="size-4" />
									)}
								</Link>
							</Button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{FEATURED_WORKSHOPS.map((shop) => (
								<Card
									key={shop.name}
									className="p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-colors"
								>
									<div>
										<div className="size-12 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center p-1 font-bold">
											{shop.logo ? (
												<img
													src={shop.logo}
													alt={shop.name}
													className="size-full object-contain"
												/>
											) : (
												<Wrench className="size-6 text-muted-foreground" />
											)}
										</div>
										<h4 className="font-heading text-base font-bold text-foreground mt-3">
											{shop.name}
										</h4>
										<p className="text-xs text-muted-foreground">{shop.city}</p>
										<p className="text-xs font-medium text-primary mt-1">
											{shop.category}
										</p>
										<div className="flex items-center gap-1.5 mt-2 text-xs">
											<Star className="size-3.5 fill-amber-500 text-amber-500" />
											<span className="font-semibold text-foreground">
												{shop.rating}
											</span>
											<span className="text-muted-foreground">
												({shop.reviews})
											</span>
										</div>
									</div>

									<div className="mt-4 pt-3 border-t border-border/50">
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs"
											asChild
										>
											<Link
												to="/$locale/listings"
												params={{ locale }}
												search={{ sellerType: "workshop" }}
											>
												{t.home.viewWorkshop}
											</Link>
										</Button>
									</div>
								</Card>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── 8. TRUST BADGES ROW ────────────────────────────────────── */}
			<section className="border-t border-border bg-muted/30 py-10">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
						<div className="flex flex-col items-center">
							<ShieldCheck className="size-8 text-primary mb-2" />
							<h4 className="font-heading text-sm font-bold text-foreground">
								{t.home.verifiedSellersTitle}
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
								{t.home.verifiedSellersDesc}
							</p>
						</div>
						<div className="flex flex-col items-center">
							<CreditCard className="size-8 text-primary mb-2" />
							<h4 className="font-heading text-sm font-bold text-foreground">
								{t.home.securePaymentsTitle}
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
								{t.home.securePaymentsDesc}
							</p>
						</div>
						<div className="flex flex-col items-center">
							<Wrench className="size-8 text-primary mb-2" />
							<h4 className="font-heading text-sm font-bold text-foreground">
								{t.home.inspectionTitle}
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
								{t.home.inspectionDesc}
							</p>
						</div>
						<div className="flex flex-col items-center">
							<Headphones className="size-8 text-primary mb-2" />
							<h4 className="font-heading text-sm font-bold text-foreground">
								{t.home.supportTitle}
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
								{t.home.supportDesc}
							</p>
						</div>
						<div className="flex flex-col items-center col-span-2 sm:col-span-1">
							<Globe className="size-8 text-primary mb-2" />
							<h4 className="font-heading text-sm font-bold text-foreground">
								{t.home.wideReachTitle}
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
								{t.home.wideReachDesc}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ── 9. INK NAVY SELL CTA BANNER ────────────────────────────── */}
			<section className="bg-slate-950 text-white py-12 sm:py-16">
				<div className="container mx-auto px-4 sm:px-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="space-y-2 text-center md:text-start">
							<h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
								{t.home.readyToSell}
							</h3>
							<p className="text-sm text-slate-300">
								{locale === "ar"
									? "انشر إعلانك اليوم واحصل على مشترين مباشرين ومضمونين بأفضل سعر."
									: "Publish your advertisement today and connect directly with verified buyers across Sudan."}
							</p>
						</div>

						<Button size="lg" className="shrink-0 gap-2 font-bold px-8" asChild>
							<Link to="/$locale/dashboard/listings/new" params={{ locale }}>
								<span>{t.home.postAdNow}</span>
								{dir === "rtl" ? (
									<ChevronLeft className="size-5" />
								) : (
									<ChevronRight className="size-5" />
								)}
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Location Selector Modal */}
			<LocationSelectorModal
				open={locationModalOpen}
				onOpenChange={setLocationModalOpen}
				initialLocation={selectedLocation}
				onSelectLocation={setSelectedLocation}
			/>
		</div>
	);
}
