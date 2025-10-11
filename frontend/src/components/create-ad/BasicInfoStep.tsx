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
import { MapPin } from 'lucide-react'
import { categoriesData, nigerianStates } from '@/data/categoriesData'
import AdTypeIndicator from './AdTypeIndicator'

interface BasicInfoStepProps {
  formData: any
  errors: any
  subcategoryOptions: any[]
  selectedCategory: any
  onInputChange: (field: any, value: any) => void
  isEditMode?: boolean
}

export default function BasicInfoStep({
  formData,
  errors,
  subcategoryOptions,
  selectedCategory,
  onInputChange,
  isEditMode = false
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Ad Type Indicator */}
      {formData.category && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update your ad information' : 'Tell us about what you are posting'}
            </p>
          </div>
          <AdTypeIndicator adType={formData.adType} />
        </div>
      )}

      {/* Category Selection - Read-only in edit mode */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        {isEditMode ? (
          <div className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-700">
            <span className="flex items-center gap-2">
              <span>{selectedCategory?.icon}</span>
              <span>{selectedCategory?.name}</span>
            </span>
          </div>
        ) : (
          <Select value={formData.category} onValueChange={(value) => onInputChange('category', value)}>
            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesData.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      {/* Subcategory Selection */}
      {formData.category && subcategoryOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Subcategory <span className="text-red-500">*</span>
          </label>
          <Select value={formData.subcategory} onValueChange={(value) => onInputChange('subcategory', value)}>
            <SelectTrigger className={errors.subcategory ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subcategoryOptions.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {formData.adType === 'cv' ? 'Professional Title' : 'Ad Title'} <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          placeholder={
            formData.adType === 'cv' 
              ? 'e.g., Experienced Full Stack Developer' 
              : formData.adType === 'service' 
                ? 'e.g., Professional Plumbing Services' 
                : 'e.g., iPhone 14 Pro Max 256GB'
          }
          className={errors.title ? 'border-red-500' : ''}
          maxLength={100}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          <p className="text-xs text-gray-500 ml-auto">{formData.title.length}/100</p>
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <Select value={formData.state} onValueChange={(value) => onInputChange('state', value)}>
            <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {nigerianStates.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            City / Area <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              placeholder="e.g., Ikeja, Surulere"
              className={`pl-10 ${errors.city ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
      </div>
    </div>
  )
}

