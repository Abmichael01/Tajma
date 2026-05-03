import {
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { savedAdsApi } from "@/api/savedAds";
import type { Ad } from "@/api/types";
import { useAuthStore } from "@/store/authStore";

type QuerySnapshot = {
  queryKey: QueryKey;
  data: unknown;
};

type SaveMutationContext = {
  previousQueries: QuerySnapshot[];
};

type MutableRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is MutableRecord =>
  typeof value === "object" && value !== null;

const adMatches = (ad: unknown, adId: string) =>
  isRecord(ad) && (ad.id === adId || ad.slug === adId);

const getSavedCount = (
  ad: MutableRecord,
  nextSaved: boolean,
  confirmedCount?: number,
) => {
  if (typeof confirmedCount === "number") return confirmedCount;

  const currentSaved = ad.is_saved === true;
  const currentCount = typeof ad.saved_count === "number" ? ad.saved_count : 0;

  if (currentSaved === nextSaved) return currentCount;
  return nextSaved ? currentCount + 1 : Math.max(0, currentCount - 1);
};

const withSaveState = <T extends MutableRecord>(
  ad: T,
  nextSaved: boolean,
  confirmedCount?: number,
): T => ({
  ...ad,
  is_saved: nextSaved,
  saved_count: getSavedCount(ad, nextSaved, confirmedCount),
});

const findAdInData = (data: unknown, adId: string): Ad | undefined => {
  if (adMatches(data, adId)) return data as Ad;

  if (Array.isArray(data)) {
    return data.find((ad) => adMatches(ad, adId)) as Ad | undefined;
  }

  if (!isRecord(data)) return undefined;

  if (Array.isArray(data.results)) {
    const ad = data.results.find((item: unknown) => adMatches(item, adId));
    if (ad) return ad as Ad;
  }

  if (Array.isArray(data.pages)) {
    for (const page of data.pages) {
      const ad = findAdInData(page, adId);
      if (ad) return ad;
    }
  }

  return undefined;
};

const findCachedAd = (queryClient: QueryClient, adId: string) => {
  for (const query of queryClient.getQueryCache().getAll()) {
    const ad = findAdInData(query.state.data, adId);
    if (ad) return ad;
  }
  return undefined;
};

const updateAdData = (
  data: unknown,
  adId: string,
  nextSaved: boolean,
  confirmedCount?: number,
): unknown => {
  if (adMatches(data, adId)) {
    return withSaveState(data as MutableRecord, nextSaved, confirmedCount);
  }

  if (Array.isArray(data)) {
    if (!data.some((ad) => adMatches(ad, adId))) return data;
    return data.map((ad) =>
      adMatches(ad, adId)
        ? withSaveState(ad as MutableRecord, nextSaved, confirmedCount)
        : ad,
    );
  }

  if (isRecord(data) && Array.isArray(data.results)) {
    if (!data.results.some((ad: unknown) => adMatches(ad, adId))) return data;
    return {
      ...data,
      results: data.results.map((ad: unknown) =>
        adMatches(ad, adId)
          ? withSaveState(ad as MutableRecord, nextSaved, confirmedCount)
          : ad,
      ),
    };
  }

  if (isRecord(data) && Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((page: unknown): unknown =>
        updateAdData(page, adId, nextSaved, confirmedCount),
      ),
    };
  }

  return data;
};

const getSavedAdsCountDelta = (
  sourceAd: Ad | undefined,
  hasAdInSavedResults: boolean,
  nextSaved: boolean,
) => {
  const wasSaved =
    sourceAd?.is_saved ?? (hasAdInSavedResults ? true : undefined);

  if (typeof wasSaved === "boolean") {
    if (wasSaved === nextSaved) return 0;
    return nextSaved ? 1 : -1;
  }

  return nextSaved ? 1 : 0;
};

const updateSavedAdsPage = (
  page: unknown,
  adId: string,
  nextSaved: boolean,
  sourceAd?: Ad,
  confirmedCount?: number,
  allowInsert = true,
) => {
  if (!isRecord(page) || !Array.isArray(page.results)) return page;

  const hasAd = page.results.some((ad: unknown) => adMatches(ad, adId));
  const delta = getSavedAdsCountDelta(sourceAd, hasAd, nextSaved);
  let results = page.results.map((ad: unknown) =>
    adMatches(ad, adId)
      ? withSaveState(ad as MutableRecord, nextSaved, confirmedCount)
      : ad,
  );

  if (!nextSaved) {
    results = results.filter((ad: unknown) => !adMatches(ad, adId));
  } else if (!hasAd && sourceAd && allowInsert) {
    results = [
      withSaveState(sourceAd as unknown as MutableRecord, true, confirmedCount),
      ...results,
    ];
  }

  return {
    ...page,
    count:
      typeof page.count === "number"
        ? Math.max(0, page.count + delta)
        : page.count,
    results,
  };
};

const updateSavedAdsData = (
  data: unknown,
  adId: string,
  nextSaved: boolean,
  sourceAd?: Ad,
  confirmedCount?: number,
) => {
  if (Array.isArray(data)) {
    const hasAd = data.some((ad) => adMatches(ad, adId));

    if (!nextSaved) {
      return hasAd ? data.filter((ad) => !adMatches(ad, adId)) : data;
    }

    if (hasAd) {
      return data.map((ad) =>
        adMatches(ad, adId)
          ? withSaveState(ad as MutableRecord, true, confirmedCount)
          : ad,
      );
    }

    return sourceAd
      ? [
          withSaveState(
            sourceAd as unknown as MutableRecord,
            true,
            confirmedCount,
          ),
          ...data,
        ]
      : data;
  }

  if (isRecord(data) && Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((page: unknown, index: number) =>
        updateSavedAdsPage(
          page,
          adId,
          nextSaved,
          sourceAd,
          confirmedCount,
          index === 0,
        ),
      ),
    };
  }

  return updateSavedAdsPage(data, adId, nextSaved, sourceAd, confirmedCount);
};

const applySaveStateToQueries = (
  queryClient: QueryClient,
  adId: string,
  nextSaved: boolean,
  options: {
    sourceAd?: Ad;
    confirmedCount?: number;
    snapshot?: boolean;
  } = {},
) => {
  const snapshots: QuerySnapshot[] = [];
  const sourceAd = options.sourceAd ?? findCachedAd(queryClient, adId);

  queryClient
    .getQueryCache()
    .getAll()
    .forEach((query) => {
      const queryKey = query.queryKey;
      const rootKey = queryKey[0];
      const currentData = query.state.data;
      let nextData = currentData;

      if (rootKey === "ad" || rootKey === "ads") {
        nextData = updateAdData(
          currentData,
          adId,
          nextSaved,
          options.confirmedCount,
        );
      } else if (rootKey === "saved-ads") {
        nextData = updateSavedAdsData(
          currentData,
          adId,
          nextSaved,
          sourceAd,
          options.confirmedCount,
        );
      }

      if (nextData !== currentData) {
        if (options.snapshot) {
          snapshots.push({ queryKey, data: currentData });
        }
        queryClient.setQueryData(queryKey, nextData);
      }
    });

  return snapshots;
};

const rollbackSaveState = (
  queryClient: QueryClient,
  context?: SaveMutationContext,
) => {
  context?.previousQueries.forEach(({ queryKey, data }) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isRecord(error) && isRecord(error.response)) {
    const data = error.response.data;
    if (isRecord(data) && typeof data.message === "string") {
      return data.message;
    }
  }

  return fallback;
};

export function useSavedAds(page?: number, pageSize?: number) {
  const { isAuthenticated } = useAuthStore();
  // For navbar, we'll fetch first page to get the count
  return useQuery({
    queryKey: ["saved-ads", page || 1, pageSize || 20],
    queryFn: () =>
      savedAdsApi.list({ page: page || 1, page_size: pageSize || 20 }),
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });
}

export function useSavedAdsInfinite() {
  const { isAuthenticated } = useAuthStore();
  return useInfiniteQuery({
    queryKey: ["saved-ads", "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      savedAdsApi.list({ page: pageParam, page_size: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        // Extract page number from next URL
        const url = new URL(lastPage.next, window.location.origin);
        const page = url.searchParams.get("page");
        return page ? parseInt(page, 10) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
  });
}

export function useToggleSaveAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.toggle(adId);
    },
    onMutate: async (adId) => {
      await queryClient.cancelQueries({ queryKey: ["ad"] });
      await queryClient.cancelQueries({ queryKey: ["ads"] });
      await queryClient.cancelQueries({ queryKey: ["saved-ads"] });

      const sourceAd = findCachedAd(queryClient, adId);
      const nextSaved = !(sourceAd?.is_saved === true);
      const previousQueries = applySaveStateToQueries(
        queryClient,
        adId,
        nextSaved,
        {
          sourceAd,
          snapshot: true,
        },
      );

      return { previousQueries };
    },
    onSuccess: (data, adId) => {
      const confirmedAd = data.ad
        ? { ...data.ad, is_saved: data.saved }
        : undefined;

      applySaveStateToQueries(queryClient, adId, data.saved, {
        sourceAd: confirmedAd,
        confirmedCount: data.ad?.saved_count,
      });

      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });

      toast.success(data.message);
    },
    onError: (error, _adId, context) => {
      rollbackSaveState(queryClient, context);
      toast.error(getApiErrorMessage(error, "Failed to save ad"));
    },
  });
}

export function useSaveAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.save(adId);
    },
    onMutate: async (adId) => {
      await queryClient.cancelQueries({ queryKey: ["ad"] });
      await queryClient.cancelQueries({ queryKey: ["ads"] });
      await queryClient.cancelQueries({ queryKey: ["saved-ads"] });

      const sourceAd = findCachedAd(queryClient, adId);
      const previousQueries = applySaveStateToQueries(queryClient, adId, true, {
        sourceAd,
        snapshot: true,
      });

      return { previousQueries };
    },
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", adId] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success(data.message);
    },
    onError: (error, _adId, context) => {
      rollbackSaveState(queryClient, context);
      toast.error(getApiErrorMessage(error, "Failed to save ad"));
    },
  });
}

export function useUnsaveAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.unsave(adId);
    },
    onMutate: async (adId) => {
      await queryClient.cancelQueries({ queryKey: ["ad"] });
      await queryClient.cancelQueries({ queryKey: ["ads"] });
      await queryClient.cancelQueries({ queryKey: ["saved-ads"] });

      const sourceAd = findCachedAd(queryClient, adId);
      const previousQueries = applySaveStateToQueries(
        queryClient,
        adId,
        false,
        {
          sourceAd,
          snapshot: true,
        },
      );

      return { previousQueries };
    },
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", adId] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success(data.message);
    },
    onError: (error, _adId, context) => {
      rollbackSaveState(queryClient, context);
      toast.error(getApiErrorMessage(error, "Failed to unsave ad"));
    },
  });
}
