"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { SearchableSelect } from './SearchableSelect'
import { useLocations } from '@/hooks/useLocations'
import { Loader2 } from 'lucide-react'

interface HierarchicalLocationPickerProps {
  initialRegionId?: number
  initialDepartmentId?: number
  onLocationSelect: (locationId: number | null) => void
  errors?: {
    region?: string
    department?: string
  }
}

export default function HierarchicalLocationPicker({
  initialRegionId,
  initialDepartmentId,
  onLocationSelect,
  errors = {}
}: HierarchicalLocationPickerProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<number | undefined>(initialRegionId)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(initialDepartmentId)

  const { data: regionsData, isLoading: regionsLoading } = useLocations({ level: 1 })
  const { data: departmentsData, isLoading: departmentsLoading } = useLocations({ parent: selectedRegionId, level: 2 }, { enabled: !!selectedRegionId })

  const regionOptions = useMemo(() => regionsData?.results.map(r => ({ value: r.id.toString(), label: r.name })) || [], [regionsData])
  const departmentOptions = useMemo(() => departmentsData?.results.map(r => ({ value: r.id.toString(), label: r.name })) || [], [departmentsData])

  useEffect(() => {
    if (initialRegionId) setSelectedRegionId(initialRegionId)
    if (initialDepartmentId) setSelectedDepartmentId(initialDepartmentId)
  }, [initialRegionId, initialDepartmentId])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 ml-1">Location</label>
          <SearchableSelect
            placeholder="Select Location"
            options={regionOptions}
            value={selectedRegionId?.toString()}
            onValueChange={(val) => {
              const id = parseInt(val)
              setSelectedRegionId(id)
              setSelectedDepartmentId(undefined)
              onLocationSelect(null)
            }}
            loading={regionsLoading}
          />
          {errors.region && <p className="text-[10px] text-red-500 ml-1">{errors.region}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 ml-1">Department</label>
          <SearchableSelect
            placeholder={selectedRegionId ? "Select Department" : "Select Location first"}
            options={departmentOptions}
            value={selectedDepartmentId?.toString()}
            onValueChange={(val) => {
              const id = parseInt(val)
              setSelectedDepartmentId(id)
              onLocationSelect(id)
            }}
            loading={departmentsLoading}
            disabled={!selectedRegionId}
          />
          {errors.department && <p className="text-[10px] text-red-500 ml-1">{errors.department}</p>}
        </div>
      </div>
    </div>
  )
}
