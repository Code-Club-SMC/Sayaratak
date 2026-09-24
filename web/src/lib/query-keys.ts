/**
 * Centralized query key factories for TanStack Query.
 *
 * Every key embeds the active locale so Arabic and English data
 * are independently cached without cross-contamination.
 *
 * Usage:
 *   queryClient.ensureQueryData(queryOptions({
 *     queryKey: keys.taxonomy.categories(locale),
 *     queryFn: ...
 *   }))
 */

// ── Taxonomy ────────────────────────────────────────────────────────────

export const taxonomyKeys = {
	all: (locale: string) => ["taxonomy", locale] as const,

	categories: (locale: string) =>
		[...taxonomyKeys.all(locale), "categories"] as const,

	makes: (locale: string) => [...taxonomyKeys.all(locale), "makes"] as const,

	models: (locale: string, makeId?: string) =>
		[...taxonomyKeys.all(locale), "models", makeId ?? "all"] as const,
};

// ── Locations ───────────────────────────────────────────────────────────

export const locationKeys = {
	all: (locale: string) => ["locations", locale] as const,

	countries: (locale: string) =>
		[...locationKeys.all(locale), "countries"] as const,

	cities: (locale: string, countryId?: string) =>
		[...locationKeys.all(locale), "cities", countryId ?? "all"] as const,

	districts: (locale: string, cityId?: string) =>
		[...locationKeys.all(locale), "districts", cityId ?? "all"] as const,
};

// ── Listings ────────────────────────────────────────────────────────────

export type ListingFilters = {
	page?: number;
	limit?: number;
	categoryId?: string;
	makeId?: string;
	modelId?: string;
	cityId?: string;
	districtId?: string;
	minPrice?: number;
	maxPrice?: number;
	minYear?: number;
	maxYear?: number;
	maxMileage?: number;
	transmission?: string;
	fuelType?: string;
	condition?: string;
	status?: string;
	lat?: number;
	lng?: number;
	radius?: number;
	sort?: string;
};

export const listingKeys = {
	all: (locale: string) => ["listings", locale] as const,

	lists: (locale: string) => [...listingKeys.all(locale), "list"] as const,
	list: (locale: string, filters: ListingFilters) =>
		[...listingKeys.lists(locale), filters] as const,

	managementLists: (locale: string) =>
		[...listingKeys.all(locale), "management"] as const,
	managementList: (locale: string, filters: ListingFilters) =>
		[...listingKeys.managementLists(locale), filters] as const,

	details: (locale: string) => [...listingKeys.all(locale), "detail"] as const,
	detail: (locale: string, id: string) =>
		[...listingKeys.details(locale), id] as const,

	managedDetails: (locale: string) =>
		[...listingKeys.all(locale), "managed-detail"] as const,
	managedDetail: (locale: string, id: string) =>
		[...listingKeys.managedDetails(locale), id] as const,

	map: (locale: string, bounds: Record<string, number>) =>
		[...listingKeys.all(locale), "map", bounds] as const,

	userListings: (locale: string, userId: string) =>
		[...listingKeys.all(locale), "user", userId] as const,
};

// ── Media ───────────────────────────────────────────────────────────────

export const mediaKeys = {
	all: () => ["media"] as const,
	signature: (entityType: string, entityId: string) =>
		[...mediaKeys.all(), "signature", entityType, entityId] as const,
};

// ── Profiles ────────────────────────────────────────────────────────────

export const profileKeys = {
	all: (locale: string) => ["profiles", locale] as const,

	detail: (locale: string, type: string, id: string) =>
		[...profileKeys.all(locale), type, id] as const,

	map: (locale: string, type: string) =>
		[...profileKeys.all(locale), type, "map"] as const,

	directory: (
		locale: string,
		type: string,
		filters?: Record<string, unknown>,
	) => [...profileKeys.all(locale), type, "directory", filters] as const,
};

// ── Favorites ───────────────────────────────────────────────────────────

export const favoriteKeys = {
	all: (locale: string) => ["favorites", locale] as const,
	list: (locale: string, page?: number) =>
		[...favoriteKeys.all(locale), "list", page ?? 1] as const,
};

// ── Chat ────────────────────────────────────────────────────────────────

export const chatKeys = {
	all: () => ["chat"] as const,
	conversations: () => [...chatKeys.all(), "conversations"] as const,
	messages: (conversationId: string) =>
		[...chatKeys.all(), "messages", conversationId] as const,
};

// ── Notifications ───────────────────────────────────────────────────────

export const notificationKeys = {
	all: () => ["notifications"] as const,
	list: () => [...notificationKeys.all(), "list"] as const,
};

// ── Content ─────────────────────────────────────────────────────────────

export const contentKeys = {
	all: (locale: string) => ["content", locale] as const,

	banners: (locale: string) => [...contentKeys.all(locale), "banners"] as const,

	pages: (locale: string) => [...contentKeys.all(locale), "pages"] as const,
	page: (locale: string, slug: string) =>
		[...contentKeys.all(locale), "page", slug] as const,
};

// ── SEO ─────────────────────────────────────────────────────────────────

export const seoKeys = {
	metadata: (locale: string, type: string, identifier: string) =>
		["seo", locale, type, identifier] as const,
};

// ── Saved Searches ──────────────────────────────────────────────────────

export const savedSearchKeys = {
	all: () => ["saved-searches"] as const,
	list: () => [...savedSearchKeys.all(), "list"] as const,
};

// ── Reviews ─────────────────────────────────────────────────────────────

export const reviewKeys = {
	all: (locale: string) => ["reviews", locale] as const,
	forEntity: (locale: string, type: string, id: string) =>
		[...reviewKeys.all(locale), type, id] as const,
};

// ── Payments ────────────────────────────────────────────────────────────

export const paymentKeys = {
	all: () => ["payments"] as const,
	packages: (locale: string) =>
		[...paymentKeys.all(), "packages", locale] as const,
};

// ── Admin ───────────────────────────────────────────────────────────────

export const adminKeys = {
	all: () => ["admin"] as const,
	metrics: () => [...adminKeys.all(), "metrics"] as const,
	users: (filters?: Record<string, unknown>) =>
		[...adminKeys.all(), "users", filters] as const,
	listings: (filters?: Record<string, unknown>) =>
		[...adminKeys.all(), "listings", filters] as const,
	reports: (filters?: Record<string, unknown>) =>
		[...adminKeys.all(), "reports", filters] as const,
	payments: (filters?: Record<string, unknown>) =>
		[...adminKeys.all(), "payments", filters] as const,
};
