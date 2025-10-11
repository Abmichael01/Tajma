"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  conditionOptions,
  transmissionOptions,
  fuelTypeOptions,
  furnishingOptions,
  availabilityOptions,
} from '@/data/categoriesData'

interface DynamicFormFieldsProps {
  formData: any
  customFields: string[]
  onInputChange: (field: any, value: any) => void
}

export default function DynamicFormFields({
  formData,
  customFields,
  onInputChange
}: DynamicFormFieldsProps) {
  if (customFields.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Condition & Brand */}
      {customFields.includes('condition') && formData.adType === 'product' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Condition</label>
            <Select value={formData.condition} onValueChange={(value) => onInputChange('condition', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {customFields.includes('brand') && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Brand</label>
              <Input
                value={formData.brand}
                onChange={(e) => onInputChange('brand', e.target.value)}
                placeholder="e.g., Apple, Samsung"
              />
            </div>
          )}
        </div>
      )}

      {/* Model */}
      {customFields.includes('model') && formData.adType === 'product' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Model</label>
          <Input
            value={formData.model}
            onChange={(e) => onInputChange('model', e.target.value)}
            placeholder="e.g., iPhone 14 Pro Max"
          />
        </div>
      )}

      {/* Year & Mileage */}
      {customFields.includes('year') && formData.adType === 'product' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Year</label>
            <Input
              value={formData.year}
              onChange={(e) => onInputChange('year', e.target.value)}
              placeholder="e.g., 2023"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>
          {customFields.includes('mileage') && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Mileage (km)</label>
              <Input
                value={formData.mileage}
                onChange={(e) => onInputChange('mileage', e.target.value)}
                placeholder="e.g., 45000"
                type="number"
              />
            </div>
          )}
        </div>
      )}

      {/* Transmission & Fuel Type */}
      {customFields.includes('transmission') && formData.adType === 'product' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Transmission</label>
            <Select value={formData.transmission} onValueChange={(value) => onInputChange('transmission', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {transmissionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {customFields.includes('fuel_type') && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Fuel Type</label>
              <Select value={formData.fuel_type} onValueChange={(value) => onInputChange('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Property Fields: Bedrooms, Bathrooms, Furnishing */}
      {customFields.includes('bedrooms') && formData.adType === 'product' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Bedrooms</label>
            <Input
              value={formData.bedrooms}
              onChange={(e) => onInputChange('bedrooms', e.target.value)}
              placeholder="e.g., 3"
              type="number"
              min="0"
            />
          </div>
          {customFields.includes('bathrooms') && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Bathrooms</label>
              <Input
                value={formData.bathrooms}
                onChange={(e) => onInputChange('bathrooms', e.target.value)}
                placeholder="e.g., 2"
                type="number"
                min="0"
              />
            </div>
          )}
          {customFields.includes('furnishing') && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Furnishing</label>
              <Select value={formData.furnishing} onValueChange={(value) => onInputChange('furnishing', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {furnishingOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Availability for Services/CV */}
      {customFields.includes('availability') && formData.adType !== 'product' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Availability</label>
          <Select value={formData.availability} onValueChange={(value) => onInputChange('availability', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              {availabilityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

