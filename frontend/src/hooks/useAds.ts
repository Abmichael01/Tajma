import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type AdsListParams, adsApi, type PaginatedResponse } from "@/api/ads";
import type { Ad, CreateAdRequest, UpdateAdRequest } from "@/api/types";

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
    enabled,
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
 * Fetch suggested ads for the user (personalized)
 */
export const useSuggestedAds = () => {
  return useQuery({
    queryKey: ["ads", "suggested"],
    queryFn: () => adsApi.suggested(),
    staleTime: 5 * 60 * 1000, // 5 minutes (recommendations don't change that often)
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
    mutationFn: (payload: CreateAdRequest) => adsApi.create(payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ["ad", ad.slug] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      // Invalidate categories to refresh ad counts
      // Note: Categories are loaded from CDN JSON which is updated by backend signals
      // We invalidate to force a fresh fetch of the updated JSON
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
    mutationFn: (payload: UpdateAdRequest) => adsApi.update(slug, payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ["ad", slug] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", ad.slug] });
      // Invalidate categories if status changed (affects counts)
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
      // Invalidate categories to refresh ad counts
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
