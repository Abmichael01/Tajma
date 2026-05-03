import apiClient from "./apiClient";
import type { Ad, CreateAdRequest, UpdateAdRequest } from "./types";

// Paginated response type from DRF
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type AdsListParams = Record<string, unknown>;

export const adsApi = {
  async suggested() {
    const response = await apiClient.get<Ad[]>("/ads/suggested/");
    return response.data;
  },

  async trackSearch(query: string) {
    if (!query) return;
    await apiClient.post("/track-search/", { q: query });
  },

  async listPaginated(params?: AdsListParams) {
    const response = await apiClient.get<Ad[] | PaginatedResponse<Ad>>(
      "/ads/",
      { params },
    );

    // Handle paginated response (DRF wraps results in { results: [...], count: N })
    if (
      response.data &&
      typeof response.data === "object" &&
      "results" in response.data
    ) {
      return response.data as PaginatedResponse<Ad>;
    }

    // Handle direct array response (if pagination is disabled)
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      } as PaginatedResponse<Ad>;
    }

    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    } as PaginatedResponse<Ad>;
  },

  async list(params?: AdsListParams) {
    const paginatedData = await adsApi.listPaginated(params);
    return paginatedData.results;
  },

  async get(slug: string) {
    const response = await apiClient.get<Ad>(`/ads/${slug}/`);
    return response.data;
  },

  async create(payload: CreateAdRequest) {
    const response = await apiClient.post<Ad>("/ads/", payload);
    return response.data;
  },

  async update(slug: string, payload: UpdateAdRequest) {
    const response = await apiClient.patch<Ad>(`/ads/${slug}/`, payload);
    return response.data;
  },

  async remove(slug: string) {
    await apiClient.delete(`/ads/${slug}/`);
  },
};
