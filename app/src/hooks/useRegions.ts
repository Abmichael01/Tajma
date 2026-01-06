import { useQuery } from '@tanstack/react-query'
import { regionsApi, Region, RegionDetail } from '@/api/regions'

export const useRegions = () => {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes - regions don't change often
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
