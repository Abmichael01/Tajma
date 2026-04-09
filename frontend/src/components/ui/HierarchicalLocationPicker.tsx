"use client"

import React, { useState, useEffect } from 'react'
import SearchableSelect from './SearchableSelect'
import { useRegions } from '@/hooks/useRegions'
import { Loader2 } from 'lucide-react'

interface HierarchicalLocationPickerProps {
  initialRegionId?: number
  initialDepartmentId?: number
  initialCommuneId?: number
  onLocationSelect: (locationId: number | null) => void
  errors?: {
    region?: string
    department?: string
    commune?: string
  }
}

export default function HierarchicalLocationPicker({
  initialRegionId,
  initialDepartmentId,
  initialCommuneId,
  onLocationSelect,
  errors = {}
}: HierarchicalLocationPickerProps) {
  // State for selected IDs
  const [selectedRegionId, setSelectedRegionId] = useState<number | undefined>(initialRegionId)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(initialDepartmentId)
  const [selectedCommuneId, setSelectedCommuneId] = useState<number | undefined>(initialCommuneId)

  // Fetch data for each level
  const { data: regionsData, isLoading: regionsLoading } = useRegions({ parent: undefined, level: 1 }) // Level 1: Region
  const { data: departmentsData, isLoading: departmentsLoading } = useRegions(selectedRegionId ? { parent: selectedRegionId, level: 2 } : { level: 2 }) // Level 2: Department
  const { data: communesData, isLoading: communesLoading } = useRegions(selectedDepartmentId ? { parent: selectedDepartmentId, level: 3 } : { level: 3 }) // Level 3: Commune

  const regions = regionsData?.results || []
  const departments = departmentsData?.results || []
  const communes = communesData?.results || []

  // Synchronization with initial values (e.g. when loading profile)
  useEffect(() => {
    if (initialRegionId) setSelectedRegionId(initialRegionId)
  }, [initialRegionId])

  // Callbacks for selection
  const handleRegionSelect = (option: { id: string | number } | null) => {
    const id = option ? Number(option.id) : undefined
    setSelectedRegionId(id)
    setSelectedDepartmentId(undefined)
    setSelectedCommuneId(undefined)
    onLocationSelect(null) // Reset final location until commune is selected (or stay at region)
    // If you want to allow selecting only a region, you could call onLocationSelect(id) here
  }

  const handleDepartmentSelect = (option: { id: string | number } | null) => {
    const id = option ? Number(option.id) : undefined
    setSelectedDepartmentId(id)
    setSelectedCommuneId(undefined)
    onLocationSelect(null)
  }

  const handleCommuneSelect = (option: { id: string | number } | null) => {
    const id = option ? Number(option.id) : undefined
    setSelectedCommuneId(id)
    onLocationSelect(id || null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Region Picker */}
        <SearchableSelect
          label="Region"
          placeholder="Select Region"
          searchPlaceholder="Search regions..."
          options={regions}
          value={selectedRegionId}
          onSelect={handleRegionSelect}
          disabled={regionsLoading}
          error={errors.region}
        />

        {/* Department Picker */}
        <SearchableSelect
          label="Department"
          placeholder={selectedRegionId ? "Select Department" : "Select Region first"}
          searchPlaceholder="Search departments..."
          options={departments}
          value={selectedDepartmentId}
          onSelect={handleDepartmentSelect}
          disabled={!selectedRegionId || departmentsLoading}
          error={errors.department}
        />

        {/* Commune Picker */}
        <SearchableSelect
          label="Commune"
          placeholder={selectedDepartmentId ? "Select Commune" : "Select Department first"}
          searchPlaceholder="Search communes..."
          options={communes}
          value={selectedCommuneId}
          onSelect={handleCommuneSelect}
          disabled={!selectedDepartmentId || communesLoading}
          error={errors.commune}
        />
      </div>

      {(regionsLoading || (selectedRegionId && departmentsLoading) || (selectedDepartmentId && communesLoading)) && (
          <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse ml-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading subsidiary locations...</span>
          </div>
      )}
    </div>
  )
}
