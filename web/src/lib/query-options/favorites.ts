import { queryOptions } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { favoriteKeys } from "@/lib/query-keys";

export function favoriteStatusQueryOptions(locale: string, listingId: string) {
	return queryOptions({
		queryKey: favoriteKeys.status(locale, listingId),
		queryFn: () =>
			apiGet<{ favorited: boolean }>(`/api/v1/favorites/${listingId}`, {
				locale,
			}),
		staleTime: 10 * 1000,
	});
}

export const addFavorite = (locale: string, listingId: string) =>
	apiPost<{ success: boolean }>(`/api/v1/favorites/${listingId}`, undefined, {
		locale,
	});

export const removeFavorite = (locale: string, listingId: string) =>
	apiDelete<{ success: boolean }>(`/api/v1/favorites/${listingId}`, { locale });
