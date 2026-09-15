/**
 * Query options for taxonomy data (categories, makes, models).
 *
 * Taxonomy is admin-managed and changes rarely, so we use a long
 * staleTime (1 hour). These are typically loaded in route loaders
 * via `queryClient.ensureQueryData()` for SSR hydration.
 */
import { queryOptions } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { taxonomyKeys, locationKeys } from "@/lib/query-keys";

// ── Response types ──────────────────────────────────────────────────────

export type Category = {
	id: string;
	slug: string;
	nameEn: string;
	nameAr: string;
	iconUrl: string | null;
	displayOrder: number;
};

export type Make = {
	id: string;
	slug: string;
	nameEn: string;
	nameAr: string;
	logoUrl: string | null;
};

export type Model = {
	id: string;
	makeId: string;
	slug: string;
	nameEn: string;
	nameAr: string;
	vehicleType: string | null;
};

export type Country = {
	id: string;
	nameEn: string;
	nameAr: string;
	code: string;
	currencyCode: string;
	phoneCode: string;
};

export type City = {
	id: string;
	countryId: string;
	nameEn: string;
	nameAr: string;
	lat: number | null;
	lng: number | null;
};

export type District = {
	id: string;
	cityId: string;
	nameEn: string;
	nameAr: string;
	lat: number | null;
	lng: number | null;
};

// ── Taxonomy staleTime: 1 hour (admin-managed, rarely changes) ──────

const TAXONOMY_STALE_TIME = 60 * 60 * 1000;

// ── Query Options ───────────────────────────────────────────────────────

export function categoriesQueryOptions(locale: string) {
	return queryOptions({
		queryKey: taxonomyKeys.categories(locale),
		queryFn: () =>
			apiGet<Category[]>("/api/v1/taxonomy/categories", { locale }),
		staleTime: TAXONOMY_STALE_TIME,
	});
}

export function makesQueryOptions(locale: string) {
	return queryOptions({
		queryKey: taxonomyKeys.makes(locale),
		queryFn: () =>
			apiGet<Make[]>("/api/v1/taxonomy/makes", { locale }),
		staleTime: TAXONOMY_STALE_TIME,
	});
}

export function modelsQueryOptions(locale: string, makeId?: string) {
	return queryOptions({
		queryKey: taxonomyKeys.models(locale, makeId),
		queryFn: () =>
			apiGet<Model[]>("/api/v1/taxonomy/models", {
				locale,
				params: makeId ? { makeId } : undefined,
			}),
		staleTime: TAXONOMY_STALE_TIME,
		enabled: makeId !== undefined,
	});
}

export function countriesQueryOptions(locale: string) {
	return queryOptions({
		queryKey: locationKeys.countries(locale),
		queryFn: () =>
			apiGet<Country[]>("/api/v1/locations/countries", { locale }),
		staleTime: TAXONOMY_STALE_TIME,
	});
}

export function citiesQueryOptions(locale: string, countryId?: string) {
	return queryOptions({
		queryKey: locationKeys.cities(locale, countryId),
		queryFn: () =>
			apiGet<City[]>("/api/v1/locations/cities", {
				locale,
				params: countryId ? { countryId } : undefined,
			}),
		staleTime: TAXONOMY_STALE_TIME,
	});
}

export function districtsQueryOptions(locale: string, cityId?: string) {
	return queryOptions({
		queryKey: locationKeys.districts(locale, cityId),
		queryFn: () =>
			apiGet<District[]>("/api/v1/locations/districts", {
				locale,
				params: cityId ? { cityId } : undefined,
			}),
		staleTime: TAXONOMY_STALE_TIME,
		enabled: cityId !== undefined,
	});
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Get the localized name for a bilingual entity based on the current locale.
 */
export function localizedName(
	entity: { nameEn: string; nameAr: string },
	locale: string,
): string {
	return locale === "ar" ? entity.nameAr : entity.nameEn;
}
