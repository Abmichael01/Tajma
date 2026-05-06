import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { locationsApi, Location, LocationDetail, LocationParams, PaginatedResponse, Country } from '@/api/countries'

export const useLocations = (params?: LocationParams, options?: any): UseQueryResult<PaginatedResponse<Location>, Error> => {
  return useQuery<PaginatedResponse<Location>, Error>({
    queryKey: ['locations', params],
    queryFn: () => locationsApi.list(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export const useLocationDetail = (slug: string | null): UseQueryResult<LocationDetail | null, Error> => {
  return useQuery<LocationDetail | null, Error>({
    queryKey: ['locations', slug],
    queryFn: () => (slug ? locationsApi.get(slug) : null),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useCountries = (): UseQueryResult<Country[], Error> => {
  return useQuery<Country[], Error>({
    queryKey: ['countries'],
    queryFn: () => locationsApi.countries(),
    staleTime: 24 * 60 * 60 * 1000, // Countries rarely change
    refetchOnWindowFocus: false,
  })
}

export type { Location, LocationDetail }
