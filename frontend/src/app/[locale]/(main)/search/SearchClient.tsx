"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { adsApi } from '@/api/ads'
import AdsListingLayout from '@/components/ads/AdsListingLayout'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''

  // Track search query for recommendations
  React.useEffect(() => {
    if (query) {
      adsApi.trackSearch(query).catch(console.error)
    }
  }, [query])

  return (
    <AdsListingLayout
      initialFilters={{
        search: query,
        location: location || undefined,
        category: category || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
      }}
      title={query ? `Search results for "${query}"` : 'Search Results'}
      subtitle={location ? `Location: ${location}` : undefined}
      mode="search"
    />
  )
}
