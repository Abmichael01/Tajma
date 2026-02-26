import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { savedAdsApi } from '@/api/savedAds'
import { useAuthStore } from '@/store/authStore'

export function useSavedAds(page?: number, pageSize?: number) {
  const { isAuthenticated } = useAuthStore()
  // For navbar, we'll fetch first page to get the count
  return useQuery({
    queryKey: ['saved-ads', page || 1, pageSize || 20],
    queryFn: () => savedAdsApi.list({ page: page || 1, page_size: pageSize || 20 }),
    enabled: isAuthenticated, // Only fetch if user is authenticated
  })
}

export function useSavedAdsInfinite() {
  const { isAuthenticated } = useAuthStore()
  return useInfiniteQuery({
    queryKey: ['saved-ads', 'infinite'],
    queryFn: ({ pageParam = 1 }) => savedAdsApi.list({ page: pageParam, page_size: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        // Extract page number from next URL
        try {
          const url = new URL(lastPage.next, 'http://localhost:8000')
          const page = url.searchParams.get('page')
          return page ? parseInt(page, 10) : undefined
        } catch {
          return undefined
        }
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
  })
}

export function useToggleSaveAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.toggle(adId)
    },
    onMutate: async (adId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['saved-ads'] })

      // Snapshot the previous values for all ad queries
      const previousAdQueries: Array<{ queryKey: any[], data: any }> = []
      const previousAdsListQueries: Array<{ queryKey: any[], data: any }> = []

      // Find all ad queries and snapshot them
      queryClient.getQueryCache().getAll().forEach((query: any) => {
        const queryKey = query.queryKey
        if (queryKey[0] === 'ad' && query.state?.data) {
          const ad = query.state.data as any
          // Check if this is the ad we're toggling (by id or slug)
          if (ad.id === adId || ad.slug === adId) {
            previousAdQueries.push({
              queryKey,
              data: query.state.data,
            })

            // Optimistically update the ad
            queryClient.setQueryData(queryKey, (oldData: any) => {
              if (oldData) {
                const newSavedState = !oldData.is_saved
                return {
                  ...oldData,
                  is_saved: newSavedState,
                  saved_count: newSavedState
                    ? (oldData.saved_count || 0) + 1
                    : Math.max(0, (oldData.saved_count || 1) - 1),
                }
              }
              return oldData
            })
          }
        }

        // Also update ads list queries
        if (queryKey[0] === 'ads' && query.state.data) {
          const adsData = query.state.data as any
          const ads = Array.isArray(adsData) ? adsData : (adsData.results || [])

          // Check if this list contains the ad we're toggling
          const hasAd = ads.some((ad: any) => ad.id === adId || ad.slug === adId)

          if (hasAd) {
            // Snapshot previous state
            previousAdsListQueries.push({
              queryKey,
              data: query.state.data,
            })

            // Optimistically update the ads list
            const updatedAds = ads.map((ad: any) => {
              if (ad.id === adId || ad.slug === adId) {
                const newSavedState = !ad.is_saved
                return {
                  ...ad,
                  is_saved: newSavedState,
                  saved_count: newSavedState
                    ? (ad.saved_count || 0) + 1
                    : Math.max(0, (ad.saved_count || 1) - 1),
                }
              }
              return ad
            })

            queryClient.setQueryData(queryKey, (oldData: any) => {
              if (Array.isArray(oldData)) {
                return updatedAds
              }
              return {
                ...oldData,
                results: updatedAds,
              }
            })
          }
        }
      })

      // Return context with previous values for rollback
      return { previousAdQueries, previousAdsListQueries }
    },
    onError: (error, adId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousAdQueries) {
        context.previousAdQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      // Rollback ads list updates
      if (context?.previousAdsListQueries) {
        context.previousAdsListQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      console.error('Failed to save ad:', (error as any)?.response?.data?.message || 'Failed to save ad')
    },
    onSuccess: (data, adId) => {
      // Update with server response to ensure consistency
      queryClient.getQueryCache().getAll().forEach((query) => {
        const queryKey = query.queryKey
        if (queryKey[0] === 'ad' && query.state.data) {
          const ad = query.state.data as any
          if (ad.id === adId || ad.slug === adId) {
            queryClient.setQueryData(queryKey, (oldData: any) => {
              if (oldData && data.ad) {
                return {
                  ...oldData,
                  is_saved: data.saved,
                  saved_count: data.ad.saved_count,
                }
              }
              return oldData
            })
          }
        }
      })

      // Invalidate saved ads list (both regular and infinite)
      queryClient.invalidateQueries({ queryKey: ['saved-ads'] })

      // Invalidate ads list to update saved counts
      queryClient.invalidateQueries({ queryKey: ['ads'] })
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['saved-ads'] })
    },
  })
}

export function useSaveAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.save(adId)
    },
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-ads'] })
      queryClient.invalidateQueries({ queryKey: ['ad', adId] })
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      // Success - data updated
    },
    onError: (error: any) => {
      console.error('Failed to save ad:', (error as any)?.response?.data?.message || 'Failed to save ad')
    },
  })
}

export function useUnsaveAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adId: string) => {
      return savedAdsApi.unsave(adId)
    },
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-ads'] })
      queryClient.invalidateQueries({ queryKey: ['ad', adId] })
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      // Success - data updated
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to unsave ad')
    },
  })
}

