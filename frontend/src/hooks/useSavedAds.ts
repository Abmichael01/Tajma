import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { savedAdsApi } from '@/api/savedAds'
import { adsApi } from '@/api/ads'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import type { Ad } from '@/api/types'

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
        const url = new URL(lastPage.next, window.location.origin)
        const page = url.searchParams.get('page')
        return page ? parseInt(page, 10) : undefined
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
    onSuccess: (data, adId) => {
      // Invalidate saved ads list (both regular and infinite)
      queryClient.invalidateQueries({ queryKey: ['saved-ads'] })
      
      // Update the ad in cache if we have it
      queryClient.setQueryData(['ad', adId], (oldData: Ad | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            is_saved: data.saved,
            saved_count: data.ad.saved_count,
          }
        }
        return oldData
      })
      
      // Invalidate ads list to update saved counts
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save ad')
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
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save ad')
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
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to unsave ad')
    },
  })
}

