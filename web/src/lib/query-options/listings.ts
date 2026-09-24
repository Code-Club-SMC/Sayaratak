/**
 * Query options for vehicle and parts listings.
 * Connects to /api/v1/listings with comprehensive filter params.
 * Mock data is opt-in via VITE_ENABLE_MOCK_DATA=true for design/dev work only.
 */
import { queryOptions } from "@tanstack/react-query";
import type { ListingCardData } from "@/components/domain/listing-card";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { type ListingFilters, listingKeys } from "@/lib/query-keys";

export type ListingStatus =
	| "draft"
	| "available"
	| "reserved"
	| "sold"
	| "rented";

export type ListingLifecycleStatus =
	| ListingStatus
	| "pending"
	| "rejected"
	| "banned";

export type ListingMediaInput =
	| string
	| {
			url: string;
			publicId?: string;
			isPrimary?: boolean;
	  };

export type ListingMutationPayload = {
	categoryId: string;
	makeId?: string;
	modelId?: string;
	countryId: string;
	cityId: string;
	districtId?: string;
	title: string;
	description: string;
	price: number;
	currency?: string;
	status?: ListingStatus;
	lat?: number;
	lng?: number;
	year?: number;
	mileage?: number;
	transmission?: string;
	fuelType?: string;
	condition?: string;
	specs?: Record<string, unknown>;
	media?: ListingMediaInput[];
	rentalPeriod?: "daily" | "weekly" | "monthly";
};

export type ListingItem = ListingCardData & {
	categoryId?: string;
	makeId?: string;
	modelId?: string;
	countryId?: string;
	cityId?: string;
	districtId?: string;
	lat?: number;
	lng?: number;
	vehicleType?: string;
	description?: string;
	status?: ListingLifecycleStatus;
	rentalPeriod?: "daily" | "weekly" | "monthly";
	createdAt?: string;
};

export type ListingsResponse = {
	items: ListingItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

type BackendListing = {
	id: string;
	categoryId?: string | null;
	makeId?: string | null;
	modelId?: string | null;
	countryId?: string | null;
	cityId?: string | null;
	districtId?: string | null;
	title: string;
	description?: string | null;
	price: number | string;
	currency?: string | null;
	lat?: number | null;
	lng?: number | null;
	rentalPeriod?: "daily" | "weekly" | "monthly" | null;
	year?: number | null;
	mileage?: number | null;
	transmission?: string | null;
	fuelType?: string | null;
	condition?: string | null;
	specs?: Record<string, unknown> | null;
	media?: Array<string | { url?: string | null }> | null;
	status?: ListingLifecycleStatus | null;
	isFeatured?: boolean | null;
	city?: { nameEn?: string | null; nameAr?: string | null } | null;
	district?: { nameEn?: string | null; nameAr?: string | null } | null;
	user?: {
		id?: string | null;
		name?: string | null;
		accountType?: string | null;
		image?: string | null;
		phone?: string | null;
		isVerified?: boolean | null;
	} | null;
	createdAt?: string;
};

type BackendListingsResponse = {
	items: BackendListing[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

function isMockListingFallbackEnabled(): boolean {
	return (
		typeof process !== "undefined" &&
		process.env.VITE_ENABLE_MOCK_DATA === "true"
	);
}

function mapBackendListing(d: BackendListing, locale: string): ListingItem {
	const media = Array.isArray(d.media) ? d.media : [];
	const city =
		locale === "ar"
			? d.city?.nameAr || d.city?.nameEn
			: d.city?.nameEn || d.city?.nameAr;
	const district =
		locale === "ar"
			? d.district?.nameAr || d.district?.nameEn
			: d.district?.nameEn || d.district?.nameAr;

	return {
		id: d.id,
		title: d.title,
		trim: typeof d.specs?.trim === "string" ? d.specs.trim : undefined,
		price: Number(d.price),
		currency: d.currency || "SDG",
		categoryId: d.categoryId || undefined,
		makeId: d.makeId || undefined,
		modelId: d.modelId || undefined,
		countryId: d.countryId || undefined,
		cityId: d.cityId || undefined,
		districtId: d.districtId || undefined,
		lat: d.lat ?? undefined,
		lng: d.lng ?? undefined,
		description: d.description || undefined,
		year: d.year ?? undefined,
		mileage: d.mileage ?? undefined,
		transmission: d.transmission ?? undefined,
		fuelType: d.fuelType ?? undefined,
		condition: d.condition ?? undefined,
		status: d.status ?? undefined,
		rentalPeriod: d.rentalPeriod ?? undefined,
		city: city || undefined,
		district: district || undefined,
		images: media
			.map((m) => (typeof m === "string" ? m : m.url))
			.filter((url): url is string => Boolean(url)),
		isFeatured: Boolean(d.isFeatured),
		seller: {
			name: d.user?.name || "Seller",
			isVerified: false,
			accountType: d.user?.accountType || "user",
		},
		createdAt: d.createdAt,
	};
}

// High-fidelity fallback catalog exactly matching SCR-002 design screen & homepage
export const MOCK_SEARCH_LISTINGS: ListingItem[] = [
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
		vehicleType: "suv",
		categoryId: "cat-suv",
		makeId: "toyota",
		modelId: "land-cruiser",
		city: "Khartoum",
		district: "Al Riyadh",
		cityId: "city-khartoum",
		districtId: "dist-riyadh",
		images: [
			"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80",
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Al Fajer Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-10T10:00:00Z",
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
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		makeId: "hyundai",
		modelId: "elantra",
		city: "Khartoum",
		district: "Al Amarat",
		cityId: "city-khartoum",
		districtId: "dist-amarat",
		images: [
			"https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Central Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-11T12:30:00Z",
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
		vehicleType: "suv",
		categoryId: "cat-suv",
		makeId: "kia",
		modelId: "sportage",
		city: "Khartoum",
		district: "Al Manshiya",
		cityId: "city-khartoum",
		districtId: "dist-manshiya",
		images: [
			"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Auto One",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-12T09:15:00Z",
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
		vehicleType: "pickup",
		categoryId: "cat-pickup",
		makeId: "toyota",
		modelId: "hilux",
		city: "Omdurman",
		district: "Al Thawra",
		cityId: "city-omdurman",
		districtId: "dist-thawra",
		images: [
			"https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Sudan Auto",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-13T14:10:00Z",
	},
	{
		id: "latest-1",
		title: "Nissan Sunny 2022",
		trim: "1.6L Comfort",
		price: 36000000,
		currency: "SDG",
		year: 2022,
		mileage: 40000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		city: "Khartoum",
		district: "Al Riyadh",
		cityId: "city-khartoum",
		images: [
			"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
		],
		seller: { name: "Ahmed Motors", isVerified: false, accountType: "user" },
		createdAt: "2026-03-14T10:00:00Z",
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
		fuelType: "petrol",
		condition: "used",
		vehicleType: "suv",
		categoryId: "cat-suv",
		city: "Khartoum",
		district: "Al Sahafa",
		cityId: "city-khartoum",
		images: [
			"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Al Sahafa Cars",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T11:30:00Z",
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
		fuelType: "petrol",
		condition: "used",
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		city: "Khartoum",
		district: "Nile Street",
		cityId: "city-khartoum",
		images: [
			"https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Blue Nile Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T13:00:00Z",
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
		fuelType: "diesel",
		condition: "used",
		vehicleType: "pickup",
		categoryId: "cat-pickup",
		city: "Port Sudan",
		district: "Salalab",
		cityId: "city-port-sudan",
		images: [
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Red Sea Cars",
			isVerified: false,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T14:20:00Z",
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
		fuelType: "petrol",
		condition: "used",
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		city: "Khartoum",
		district: "Al Taif",
		cityId: "city-khartoum",
		images: [
			"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Al Amal Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T15:40:00Z",
	},
	{
		id: "latest-6",
		title: "Toyota Corolla 2020",
		trim: "XLI 1.6L",
		price: 46000000,
		currency: "SDG",
		year: 2020,
		mileage: 52000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		city: "Bahri",
		district: "Kafouri",
		cityId: "city-bahri",
		images: [
			"https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Kafouri Auto",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T16:15:00Z",
	},
	{
		id: "lst-001",
		title: "Toyota Land Cruiser 2020",
		trim: "GXR V6 4.0L",
		price: 125000000,
		currency: "SDG",
		year: 2020,
		mileage: 60000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "suv",
		categoryId: "cat-suv",
		makeId: "toyota",
		modelId: "land-cruiser",
		city: "Khartoum",
		district: "Al Riyadh",
		cityId: "city-khartoum",
		districtId: "dist-riyadh",
		images: [
			"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80",
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Al Riyadh Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-10T10:00:00Z",
	},
	{
		id: "lst-002",
		title: "Hyundai Elantra 2021",
		trim: "Smart Plus",
		price: 58500000,
		currency: "SDG",
		year: 2021,
		mileage: 45000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "sedan",
		categoryId: "cat-sedan",
		makeId: "hyundai",
		modelId: "elantra",
		city: "Khartoum",
		district: "Al Riyadh",
		cityId: "city-khartoum",
		districtId: "dist-riyadh",
		images: [
			"https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Khartoum Premier Auto",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-11T12:30:00Z",
	},
	{
		id: "lst-003",
		title: "Toyota Hilux 2020",
		trim: "Double Cabin 2.7L 4x4",
		price: 48000000,
		currency: "SDG",
		year: 2020,
		mileage: 55000,
		transmission: "manual",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "pickup",
		categoryId: "cat-pickup",
		makeId: "toyota",
		modelId: "hilux",
		city: "Omdurman",
		district: "Al Thawra",
		cityId: "city-omdurman",
		districtId: "dist-thawra",
		images: [
			"https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Nile Commercial Fleet",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-12T09:15:00Z",
	},
	{
		id: "lst-004",
		title: "Toyota Hiace 2018",
		trim: "Commuter",
		price: 32000000,
		currency: "SDG",
		year: 2018,
		mileage: 120000,
		transmission: "manual",
		fuelType: "diesel",
		condition: "used",
		vehicleType: "van",
		categoryId: "cat-van",
		makeId: "toyota",
		modelId: "hiace",
		city: "Khartoum",
		district: "Bahri",
		cityId: "city-khartoum",
		districtId: "dist-bahri",
		images: [
			"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Bahri Transit Agency",
			isVerified: false,
			accountType: "dealership",
		},
		createdAt: "2026-03-08T15:40:00Z",
	},
	{
		id: "lst-005",
		title: "TVS King Deluxe 2022",
		trim: "Standard Cargo & Passenger",
		price: 4800000,
		currency: "SDG",
		year: 2022,
		mileage: 120000,
		transmission: "manual",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "tuktuk",
		categoryId: "cat-tuktuk",
		makeId: "tvs",
		modelId: "king",
		city: "Omdurman",
		district: "Al Salha",
		cityId: "city-omdurman",
		districtId: "dist-salha",
		images: [
			"https://images.unsplash.com/photo-1589148938909-4d241c91ee52?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Ahmed Ibrahim",
			isVerified: false,
			accountType: "user",
		},
		createdAt: "2026-03-14T08:20:00Z",
	},
	{
		id: "lst-006",
		title: "Bajaj Boxer BM 150 2021",
		trim: "150cc Rugged Edition",
		price: 2200000,
		currency: "SDG",
		year: 2021,
		mileage: 18000,
		transmission: "manual",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "motorcycle",
		categoryId: "cat-motorcycle",
		makeId: "bajaj",
		modelId: "boxer-150",
		city: "Khartoum",
		district: "Al Amir",
		cityId: "city-khartoum",
		districtId: "dist-amir",
		images: [
			"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Osman Yassin",
			isVerified: false,
			accountType: "user",
		},
		createdAt: "2026-03-13T14:10:00Z",
	},
	{
		id: "lst-007",
		title: 'Alloy Wheel 17" 6 Holes',
		trim: "Universal Fit (Prado / Hilux)",
		price: 950000,
		currency: "SDG",
		condition: "new",
		vehicleType: "spare-parts",
		categoryId: "cat-spare-parts",
		city: "Khartoum",
		district: "Industrial Area",
		cityId: "city-khartoum",
		districtId: "dist-industrial",
		images: [
			"https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Al Sanaiyya Auto Parts",
			isVerified: true,
			accountType: "workshop",
		},
		createdAt: "2026-03-09T11:00:00Z",
	},
	{
		id: "lst-008",
		title: "Radiator for Hyundai Elantra",
		trim: "2016 – 2020 OEM Spec",
		price: 350000,
		currency: "SDG",
		condition: "new",
		vehicleType: "spare-parts",
		categoryId: "cat-spare-parts",
		city: "Khartoum",
		district: "Industrial Area",
		cityId: "city-khartoum",
		districtId: "dist-industrial",
		images: [
			"https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Modern Radiator Center",
			isVerified: true,
			accountType: "workshop",
		},
		createdAt: "2026-03-07T16:00:00Z",
	},
	{
		id: "lst-009",
		title: "Kia Sportage 2022",
		trim: "GT-Line 1.6T AWD",
		price: 64000000,
		currency: "SDG",
		year: 2022,
		mileage: 32000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "suv",
		categoryId: "cat-suv",
		makeId: "kia",
		modelId: "sportage",
		city: "Port Sudan",
		district: "Al Matar",
		cityId: "city-port-sudan",
		districtId: "dist-matar",
		images: [
			"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Red Sea Motors",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-15T09:00:00Z",
	},
	{
		id: "lst-010",
		title: "Nissan Patrol 2021",
		trim: "Titanium V8 5.6L",
		price: 140000000,
		currency: "SDG",
		year: 2021,
		mileage: 48000,
		transmission: "automatic",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "suv",
		categoryId: "cat-suv",
		makeId: "nissan",
		modelId: "patrol",
		city: "Khartoum",
		district: "Al Manshiya",
		cityId: "city-khartoum",
		districtId: "dist-manshiya",
		images: [
			"https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
		],
		isFeatured: true,
		seller: {
			name: "Elite VIP Cars",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-14T11:45:00Z",
	},
	{
		id: "lst-011",
		title: "Mitsubishi L200 2022",
		trim: "Sportero 4x4 Diesel",
		price: 44000000,
		currency: "SDG",
		year: 2022,
		mileage: 38000,
		transmission: "manual",
		fuelType: "diesel",
		condition: "used",
		vehicleType: "pickup",
		categoryId: "cat-pickup",
		makeId: "mitsubishi",
		modelId: "l200",
		city: "Al Qadarif",
		district: "Central Market",
		cityId: "city-qadarif",
		images: [
			"https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Al Qadarif Agrocars",
			isVerified: true,
			accountType: "dealership",
		},
		createdAt: "2026-03-13T16:20:00Z",
	},
	{
		id: "lst-012",
		title: "Suzuki Alto 800 2019",
		trim: "VXI 0.8L Eco",
		price: 18500000,
		currency: "SDG",
		year: 2019,
		mileage: 82000,
		transmission: "manual",
		fuelType: "petrol",
		condition: "used",
		vehicleType: "hatchback",
		categoryId: "cat-hatchback",
		makeId: "suzuki",
		modelId: "alto",
		city: "Omdurman",
		district: "Al Mohandessin",
		cityId: "city-omdurman",
		images: [
			"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
		],
		seller: {
			name: "Fatima Al Hassan",
			isVerified: false,
			accountType: "user",
		},
		createdAt: "2026-03-12T13:10:00Z",
	},
];

/**
 * Filter and sort listings in-memory for fallback simulation
 */
export function filterAndSortMockListings(
	filters: ListingFilters & {
		q?: string;
		vehicleType?: string;
		sellerType?: string;
	},
): { items: ListingItem[]; total: number } {
	let results = [...MOCK_SEARCH_LISTINGS];

	if (filters.q) {
		const q = filters.q.toLowerCase();
		results = results.filter(
			(l) =>
				l.title.toLowerCase().includes(q) ||
				l.trim?.toLowerCase().includes(q) ||
				l.city?.toLowerCase().includes(q),
		);
	}

	if (filters.categoryId) {
		results = results.filter((l) => l.categoryId === filters.categoryId);
	}

	if (filters.makeId) {
		results = results.filter((l) => l.makeId === filters.makeId);
	}

	if (filters.modelId) {
		results = results.filter((l) => l.modelId === filters.modelId);
	}

	if (filters.cityId) {
		results = results.filter((l) => l.cityId === filters.cityId);
	}

	if (filters.districtId) {
		results = results.filter((l) => l.districtId === filters.districtId);
	}

	if (filters.vehicleType) {
		results = results.filter((l) => l.vehicleType === filters.vehicleType);
	}

	if (filters.minPrice !== undefined) {
		results = results.filter((l) => l.price >= filters.minPrice!);
	}

	if (filters.maxPrice !== undefined) {
		results = results.filter((l) => l.price <= filters.maxPrice!);
	}

	if (filters.minYear !== undefined) {
		results = results.filter((l) => (l.year ?? 0) >= filters.minYear!);
	}

	if (filters.maxYear !== undefined) {
		results = results.filter((l) => (l.year ?? 9999) <= filters.maxYear!);
	}

	if (filters.maxMileage !== undefined) {
		results = results.filter((l) => (l.mileage ?? 0) <= filters.maxMileage!);
	}

	if (filters.transmission) {
		results = results.filter((l) => l.transmission === filters.transmission);
	}

	if (filters.fuelType) {
		results = results.filter((l) => l.fuelType === filters.fuelType);
	}

	if (filters.condition) {
		results = results.filter((l) => l.condition === filters.condition);
	}

	if (filters.sellerType) {
		if (filters.sellerType === "verified") {
			results = results.filter((l) => l.seller?.isVerified);
		} else if (filters.sellerType === "dealer") {
			results = results.filter((l) => l.seller?.accountType === "dealership");
		} else if (filters.sellerType === "individual") {
			results = results.filter((l) => l.seller?.accountType === "user");
		}
	}

	// Sorting
	if (filters.sort === "price_asc") {
		results.sort((a, b) => a.price - b.price);
	} else if (filters.sort === "price_desc") {
		results.sort((a, b) => b.price - a.price);
	} else if (filters.sort === "mileage_asc") {
		results.sort((a, b) => (a.mileage ?? 0) - (b.mileage ?? 0));
	} else {
		// Newest first (default)
		results.sort(
			(a, b) =>
				new Date(b.createdAt ?? 0).getTime() -
				new Date(a.createdAt ?? 0).getTime(),
		);
	}

	const total = results.length;
	const page = filters.page ?? 1;
	const limit = filters.limit ?? 20;
	const offset = (page - 1) * limit;
	const paginated = results.slice(offset, offset + limit);

	return { items: paginated, total };
}

export function listingsQueryOptions(
	locale: string,
	filters: ListingFilters & {
		q?: string;
		vehicleType?: string;
		sellerType?: string;
	},
) {
	return queryOptions({
		queryKey: listingKeys.list(locale, filters),
		queryFn: async (): Promise<ListingsResponse> => {
			try {
				const data = await apiGet<BackendListingsResponse>("/api/v1/listings", {
					locale,
					params: filters as Record<string, string | number | boolean>,
				});

				return {
					items: data.items.map((item) => mapBackendListing(item, locale)),
					total: data.total,
					page: data.page,
					limit: data.limit,
					totalPages: data.totalPages,
				};
			} catch (err) {
				if (!isMockListingFallbackEnabled()) throw err;

				const { items, total } = filterAndSortMockListings(filters);
				const limit = filters.limit ?? 20;
				return {
					items,
					total,
					page: filters.page ?? 1,
					limit,
					totalPages: Math.max(1, Math.ceil(total / limit)),
				};
			}
		},
		staleTime: 30 * 1000, // 30 seconds
	});
}

export function managementListingsQueryOptions(
	locale: string,
	filters: ListingFilters = { page: 1, limit: 20 },
) {
	return queryOptions({
		queryKey: listingKeys.managementList(locale, filters),
		queryFn: async (): Promise<ListingsResponse> => {
			const data = await apiGet<BackendListingsResponse>(
				"/api/v1/listings/me",
				{
					locale,
					params: filters as Record<string, string | number | boolean>,
				},
			);

			return {
				items: data.items.map((item) => mapBackendListing(item, locale)),
				total: data.total,
				page: data.page,
				limit: data.limit,
				totalPages: data.totalPages,
			};
		},
		staleTime: 30 * 1000,
	});
}

export type ListingDetail = ListingItem & {
	description: string;
	specs?: {
		trim?: string;
		drivetrain?: string;
		engineSize?: string;
		exteriorColor?: string;
		interiorColor?: string;
		vinStatus?: string;
		registeredCity?: string;
		serviceHistory?: string;
		postedOn?: string;
		listingId?: string;
		[key: string]: any;
	};
	seller: {
		name: string;
		isVerified: boolean;
		accountType: "dealership" | "workshop" | "mechanic" | "user";
		phone?: string;
		whatsapp?: string;
		rating?: number;
		reviewCount?: number;
		bio?: string;
		avatarUrl?: string;
	};
	status: ListingLifecycleStatus;
	media: { url: string; publicId?: string; isPrimary?: boolean }[];
	relatedListings?: ListingItem[];
};

export const createListing = (
	locale: string,
	payload: ListingMutationPayload,
) => apiPost<ListingDetail>("/api/v1/listings", payload, { locale });

export const updateListing = (
	locale: string,
	id: string,
	payload: Partial<ListingMutationPayload>,
) => apiPut<ListingDetail>(`/api/v1/listings/${id}`, payload, { locale });

export const updateListingStatus = (
	locale: string,
	id: string,
	status: ListingStatus,
) =>
	apiPatch<ListingDetail>(
		`/api/v1/listings/${id}/status`,
		{ status },
		{ locale },
	);

export const deleteListing = (locale: string, id: string) =>
	apiDelete<{ success: boolean }>(`/api/v1/listings/${id}`, { locale });

export const MOCK_DETAIL_LAND_CRUISER: ListingDetail = {
	id: "lst-001",
	title: "Toyota Land Cruiser 2020",
	trim: "GXR V6 4.0L",
	price: 125000000,
	currency: "SDG",
	year: 2020,
	mileage: 60000,
	transmission: "automatic",
	fuelType: "petrol",
	condition: "used",
	vehicleType: "suv",
	categoryId: "cat-suv",
	makeId: "toyota",
	modelId: "land-cruiser",
	city: "Khartoum",
	district: "Al Riyadh",
	status: "available",
	images: [
		"https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=85",
		"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
		"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
		"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
		"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
	],
	media: [
		{
			url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=85",
			isPrimary: true,
		},
		{
			url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
		},
		{
			url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
		},
		{
			url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
		},
		{
			url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
		},
	],
	description:
		"Immaculate Toyota Land Cruiser 2020 VX.R 4.0L in excellent condition. Full service history at Toyota authorized dealer. Accident free, single owner, and well maintained. Comes with premium leather interior, sunroof, rear entertainment, and 8 airbags. Ready to drive across Sudan with zero mechanical issues.",
	specs: {
		trim: "VX.R 4.0L",
		drivetrain: "4WD Full-Time",
		engineSize: "4.0L V6 Dual VVT-i",
		exteriorColor: "White Pearl",
		interiorColor: "Beige Premium Leather",
		vinStatus: "Verified",
		registeredCity: "Khartoum",
		serviceHistory: "Full Authorized Service History",
		postedOn: "May 24, 2025",
		listingId: "STK-2025-0524-00178",
	},
	seller: {
		name: "Al Fajer Motors",
		isVerified: true,
		accountType: "dealership",
		phone: "+249 912 345 678",
		whatsapp: "+249912345678",
		rating: 4.8,
		reviewCount: 126,
		bio: "Trusted automotive dealer in Khartoum specializing in quality pre-owned vehicles. All vehicles are inspected and come with market-leading guarantees.",
	},
	createdAt: "2026-03-10T10:00:00Z",
};

export function listingDetailQueryOptions(locale: string, id: string) {
	return queryOptions({
		queryKey: listingKeys.detail(locale, id),
		queryFn: async (): Promise<ListingDetail> => {
			try {
				const data = await apiGet<any>(`/api/v1/listings/${id}`, { locale });
				if (data?.id) {
					const city =
						locale === "ar"
							? data.city?.nameAr || data.city?.nameEn
							: data.city?.nameEn || data.city?.nameAr;
					const district =
						locale === "ar"
							? data.district?.nameAr || data.district?.nameEn
							: data.district?.nameEn || data.district?.nameAr;

					return {
						id: data.id,
						title: data.title,
						trim: data.specs?.trim || data.trim,
						price: Number(data.price),
						currency: data.currency || "SDG",
						year: data.year,
						mileage: data.mileage,
						transmission: data.transmission,
						fuelType: data.fuelType,
						condition: data.condition,
						city,
						district,
						status: data.status || "available",
						description: data.description || "",
						specs: data.specs || {},
						media: Array.isArray(data.media)
							? data.media.map((m: any) =>
									typeof m === "string" ? { url: m } : m,
								)
							: [],
						images: Array.isArray(data.media)
							? data.media.map((m: any) => (typeof m === "string" ? m : m.url))
							: [],
						seller: {
							name: data.user?.name || "Seller",
							isVerified: Boolean(data.user?.isVerified),
							accountType: data.user?.accountType || "user",
							phone: data.user?.phone || undefined,
							whatsapp: data.user?.phone || undefined,
							rating: 4.8,
							reviewCount: 126,
							bio: "Trusted automotive dealer in Khartoum specializing in quality pre-owned vehicles.",
						},
						createdAt: data.createdAt,
					};
				}
			} catch (err) {
				if (!isMockListingFallbackEnabled()) throw err;
				console.warn("Using fallback listing detail for id", id, err);
			}

			if (!isMockListingFallbackEnabled()) {
				throw new Error(`Listing ${id} did not return a valid detail payload`);
			}

			// Fallback: search in mock list or return mock Land Cruiser
			const found = MOCK_SEARCH_LISTINGS.find((l) => l.id === id);
			if (found) {
				return {
					...MOCK_DETAIL_LAND_CRUISER,
					...found,
					id: found.id,
					title: found.title,
					trim: found.trim || MOCK_DETAIL_LAND_CRUISER.trim,
					price: found.price,
					year: found.year,
					mileage: found.mileage,
					city: found.city,
					district: found.district,
					media: (found.images && found.images.length > 0
						? found.images
						: MOCK_DETAIL_LAND_CRUISER.images
					).map((img, i) => ({
						url: img,
						isPrimary: i === 0,
					})),
					description:
						found.description ||
						`Excellent condition ${found.title}. Inspected and certified with full service records. Clean interior, well-maintained engine, authorized dealer maintenance history. Ready to drive with no mechanical faults.`,
					specs: {
						...MOCK_DETAIL_LAND_CRUISER.specs,
						trim: found.trim || "Standard",
						drivetrain:
							found.vehicleType === "suv" || found.vehicleType === "pickup"
								? "4WD / AWD"
								: "FWD",
						engineSize:
							found.vehicleType === "tuktuk"
								? "200cc"
								: found.vehicleType === "motorcycle"
									? "150cc"
									: "1.6L - 2.0L",
						exteriorColor: "Silver Metallic",
						interiorColor: "Dark Grey Fabric",
						vinStatus: "Verified",
						registeredCity: found.city || "Khartoum",
						listingId: `STK-${found.id.toUpperCase()}`,
					},
					seller: {
						name: found.seller?.name || "Verified Dealer",
						isVerified: Boolean(found.seller?.isVerified ?? true),
						accountType: (found.seller?.accountType as any) || "dealership",
						phone: "+249 912 345 678",
						whatsapp: "+249912345678",
						rating: 4.8,
						reviewCount: 42,
						bio: "Reliable automotive seller in Sudan. Inspect and test drive anytime.",
					},
				};
			}

			return {
				...MOCK_DETAIL_LAND_CRUISER,
				id,
			};
		},
		staleTime: 60 * 1000,
	});
}

export function managedListingDetailQueryOptions(locale: string, id: string) {
	return queryOptions({
		queryKey: listingKeys.managedDetail(locale, id),
		queryFn: async (): Promise<ListingDetail> => {
			const data = await apiGet<
				BackendListing & { user?: BackendListing["user"] }
			>(`/api/v1/listings/manage/${id}`, { locale });

			const city =
				locale === "ar"
					? data.city?.nameAr || data.city?.nameEn
					: data.city?.nameEn || data.city?.nameAr;
			const district =
				locale === "ar"
					? data.district?.nameAr || data.district?.nameEn
					: data.district?.nameEn || data.district?.nameAr;
			const media = Array.isArray(data.media)
				? data.media.map((m) =>
						typeof m === "string" ? { url: m } : { url: m.url || "" },
					)
				: [];

			return {
				id: data.id,
				title: data.title,
				trim:
					typeof data.specs?.trim === "string" ? data.specs.trim : undefined,
				price: Number(data.price),
				currency: data.currency || "SDG",
				year: data.year ?? undefined,
				mileage: data.mileage ?? undefined,
				transmission: data.transmission ?? undefined,
				fuelType: data.fuelType ?? undefined,
				condition: data.condition ?? undefined,
				categoryId: data.categoryId,
				makeId: data.makeId,
				modelId: data.modelId,
				cityId: data.cityId,
				districtId: data.districtId,
				lat: data.lat ?? undefined,
				lng: data.lng ?? undefined,
				city: city || undefined,
				district: district || undefined,
				status: data.status || "draft",
				rentalPeriod: data.rentalPeriod ?? undefined,
				description: data.description || "",
				specs: data.specs || {},
				media,
				images: media.map((m) => m.url).filter(Boolean),
				seller: {
					name: data.user?.name || "Seller",
					isVerified: Boolean(data.user?.isVerified),
					accountType:
						(data.user
							?.accountType as ListingDetail["seller"]["accountType"]) ||
						"user",
					phone: data.user?.phone || undefined,
					whatsapp: data.user?.phone || undefined,
				},
				createdAt: data.createdAt,
			};
		},
		staleTime: 30 * 1000,
	});
}
