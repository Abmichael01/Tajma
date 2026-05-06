"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useLocations, useCountries } from '@/hooks/useLocations'
import { Country, Location } from '@/api/countries'
import { SearchableSelect } from './SearchableSelect'

interface SmartLocationSearchProps {
  onLocationSelect: (location: Location | null, country: Country | null) => void
  initialLocationId?: number
  initialCountryId?: number
  className?: string
  error?: string
}

export default function SmartLocationSearch({
  onLocationSelect,
  initialLocationId,
  initialCountryId,
  className,
  error
}: SmartLocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(initialCountryId)
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(initialLocationId)

  const { data: countries, isLoading: countriesLoading } = useCountries()
  
  const { data: searchResults, isLoading: searching } = useLocations({
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    country: selectedCountryId,
    // Avoid level 3 (Communes)
    level: searchQuery.length >= 2 ? 'all' : 1 
  })

  // Pre-load selected location details if we only have an ID
  const { data: selectedLocationData } = useLocations(
    { ids: selectedLocationId ? [selectedLocationId] : undefined },
    { enabled: !!selectedLocationId }
  )

  const selectedCountry = useMemo(() => 
    countries?.find(c => c.id === selectedCountryId), 
    [countries, selectedCountryId]
  )

  const filteredResults = useMemo(() => {
    if (!searchResults) return []
    // Filter out level 3 (Communes) just in case
    return searchResults.results.filter(r => (r.level || 0) <= 2)
  }, [searchResults])

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null
    // Try to find in search results first
    const found = filteredResults.find(r => r.id === selectedLocationId)
    if (found) return found
    // Fallback to loaded single location data
    return selectedLocationData?.results?.[0] || null
  }, [filteredResults, selectedLocationId, selectedLocationData])

  // Sync internal state with props if they change
  useEffect(() => {
    if (initialCountryId !== undefined) setSelectedCountryId(initialCountryId)
    if (initialLocationId !== undefined) setSelectedLocationId(initialLocationId)
  }, [initialCountryId, initialLocationId])

  const countryOptions = useMemo(() => 
    countries?.map(c => ({
      value: c.id.toString(),
      label: c.name,
      icon: <span className="text-xl">{c.flag_emoji}</span>
    })) || [], 
    [countries]
  )

  const locationOptions = useMemo(() => {
    const options = filteredResults.map(r => ({
      value: r.id.toString(),
      label: r.name,
      description: `${r.subdivision_type || (r.level === 1 ? 'Location' : 'Department')} • ${r.full_name || ''}`
    })) || []

    // If we have a selected location that's not in results, add it manually so it shows in the select
    if (selectedLocation && !options.find(o => o.value === selectedLocation.id.toString())) {
      options.unshift({
        value: selectedLocation.id.toString(),
        label: selectedLocation.name,
        description: `${selectedLocation.subdivision_type || (selectedLocation.level === 1 ? 'Location' : 'Department')} • ${selectedLocation.full_name || ''}`
      })
    }

    return options
  }, [filteredResults, selectedLocation])

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Country Select */}
        <div className="space-y-1.5 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 truncate">Country</label>
          <SearchableSelect
            options={countryOptions}
            value={selectedCountryId?.toString()}
            onValueChange={(val) => {
              const cid = parseInt(val)
              setSelectedCountryId(cid)
              setSelectedLocationId(undefined)
              const country = countries?.find(c => c.id === cid) || null
              onLocationSelect(null, country)
            }}
            placeholder="Country"
            loading={countriesLoading}
            className={cn("w-full", error && !selectedCountryId && "border-red-500")}
          />
        </div>

        {/* Location Select */}
        <div className="space-y-1.5 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 truncate">City / Area</label>
          <SearchableSelect
            options={locationOptions}
            value={selectedLocationId?.toString()}
            onValueChange={(val) => {
              const lid = parseInt(val)
              setSelectedLocationId(lid)
              const location = filteredResults.find(r => r.id === lid) || selectedLocationData?.results?.[0] || null
              onLocationSelect(location, selectedCountry || null)
            }}
            onSearchChange={setSearchQuery}
            placeholder={selectedCountry ? `Search...` : "Country first"}
            searchPlaceholder="Search city..."
            loading={searching}
            disabled={!selectedCountryId}
            className={cn("w-full", error && !selectedLocationId && "border-red-500")}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{error}</p>}
    </div>
  )
}
