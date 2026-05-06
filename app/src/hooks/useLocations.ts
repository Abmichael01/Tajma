import { useQuery } from '@tanstack/react-query'
import { countriesApi, Country, CountryDetail, BaseCountry } from '@/api/countries'

export const useLocations = (parentId?: number | null, level?: number, countryId?: number) => {
  return useQuery({
    queryKey: ['locations', { parentId, level, countryId }],
    queryFn: () => countriesApi.list(parentId, level, countryId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.countries(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useLocationDetail = (slug: string | null) => {
  return useQuery({
    queryKey: ['locations', slug],
    queryFn: () => (slug ? countriesApi.get(slug) : null),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export type { Country, CountryDetail, BaseCountry }
