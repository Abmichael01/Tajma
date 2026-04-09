import { useQuery } from '@tanstack/react-query'
import { regionsApi, Region, RegionDetail } from '@/api/regions'

export const useRegions = (parentId?: number | null, level?: number) => {
  return useQuery({
    queryKey: ['regions', { parentId, level }],
    queryFn: () => regionsApi.list(parentId, level),
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
