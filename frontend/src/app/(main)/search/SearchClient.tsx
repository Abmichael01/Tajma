"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import AdsListingLayout from '@/components/ads/AdsListingLayout'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''

  return (
    <AdsListingLayout
      initialFilters={{
        search: query,
        location: location || undefined,
      }}
      title={query ? `Search results for "${query}"` : 'Search Results'}
      subtitle={location ? `Location: ${location}` : undefined}
      mode="search"
    />
  )
}
