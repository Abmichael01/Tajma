import { useQuery } from '@tanstack/react-query'
import { regionsApi, Region, RegionDetail, RegionParams } from '@/api/regions'

export const useRegions = (params?: RegionParams) => {
  return useQuery({
    queryKey: ['regions', params],
    queryFn: () => regionsApi.list(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useRegionDetail = (slug: string | null) => {
  return useQuery({
    queryKey: ['regions', slug],
    queryFn: () => (slug ? regionsApi.get(slug) : null),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export type { Region, RegionDetail }

