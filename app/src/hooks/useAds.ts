import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adsApi, type AdsListParams, type PaginatedResponse } from "@/api/ads";
import type { Ad } from "@/api/types";

// ============================================================================
// QUERIES - Fetching Ad Data
// ============================================================================

/**
 * Fetch a single ad by slug
 */
export const useAdDetails = (slug: string, enabled = true) => {
  return useQuery({
    queryKey: ["ad", slug],
    queryFn: () => adsApi.get(slug),
    enabled: enabled && !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a list of ads with optional filters
 * @param params - Query parameters (status, category, user, etc.)
 */
export const useAdsList = (params?: AdsListParams) => {
  return useQuery({
    queryKey: ["ads", params],
    queryFn: () => adsApi.list(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

const getNextPageParam = (lastPage: PaginatedResponse<Ad>) => {
  if (!lastPage.next) return undefined;

  const pageMatch = lastPage.next.match(/[?&]page=(\d+)/);
  if (pageMatch?.[1]) return Number.parseInt(pageMatch[1], 10);

  try {
    const url = new URL(lastPage.next, "http://localhost");
    const page = url.searchParams.get("page");
    return page ? Number.parseInt(page, 10) : undefined;
  } catch {
    return undefined;
  }
};

export const useAdsInfiniteList = (params?: AdsListParams, pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ["ads", "infinite", params, pageSize],
    queryFn: ({ pageParam = 1 }) =>
      adsApi.listPaginated({
        ...params,
        page: pageParam,
        page_size: pageSize,
      }),
    getNextPageParam,
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch ads belonging to a specific user
 * @param userId - The user ID to fetch ads for
 * @param status - Optional status filter (published, draft, archived)
 */
export const useUserAds = (userId?: number, status?: string) => {
  return useQuery({
    queryKey: ["ads", "user", userId, status],
    queryFn: () => adsApi.list({ user: userId, ...(status && { status }) }),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

// ============================================================================
// MUTATIONS - Creating, Updating, Deleting Ads
// ============================================================================

/**
 * Create a new ad
 */
export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adsApi.create(payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ["ad", ad.slug] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

/**
 * Update an existing ad
 * @param slug - The slug of the ad to update
 */
export const useUpdateAd = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adsApi.update(slug, payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ["ad", slug] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", ad.slug] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

/**
 * Delete an ad
 * @param slug - The slug of the ad to delete
 */
export const useDeleteAd = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adsApi.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.removeQueries({ queryKey: ["ad", slug] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
