"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, Trash2, Tag } from 'lucide-react'
import {
  conditionOptions,
  transmissionOptions,
  fuelTypeOptions,
  furnishingOptions,
  availabilityOptions,
} from '@/data/categoriesData'

export interface CustomFieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'array' | 'checkbox' | 'tags'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  children?: CustomFieldConfig[] // For array type, defines sub-fields
  required?: boolean
  min?: number
  max?: number
}

interface DynamicFormFieldsProps {
  formData: any
  customFields: CustomFieldConfig[] | string[] // Support both old and new format
  onInputChange: (field: any, value: any) => void
}

// Tags Input Component
const TagsInput = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  required 
}: { 
  value: string[] | string | undefined
  onChange: (tags: string[]) => void
  placeholder?: string
  label: string
  required?: boolean
}) => {
  const tagsValue = Array.isArray(value) ? value : (value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
  const [tagInput, setTagInput] = React.useState('')
  
  const handleTagAdd = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tagsValue.includes(trimmedTag)) {
      onChange([...tagsValue, trimmedTag])
      setTagInput('')
    }
  }
  
  const handleTagRemove = (tagToRemove: string) => {
    onChange(tagsValue.filter((t: string) => t !== tagToRemove))
  }
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (tagInput.trim()) {
        handleTagAdd(tagInput)
      }
    }
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="border border-gray-300 p-2 min-h-[42px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-secondary/20 focus-within:border-secondary">
        {tagsValue.map((tag: string, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary text-sm rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleTagRemove(tag)}
              className="hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          onBlur={() => {
            if (tagInput.trim()) {
              handleTagAdd(tagInput)
            }
          }}
          placeholder={placeholder || 'Type and press Enter or comma'}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[150px]"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Press Enter or comma to add a tag</p>
    </div>
  )
}

// Helper to convert old format (string[]) to new format (CustomFieldConfig[])
const normalizeCustomFields = (fields: CustomFieldConfig[] | string[]): CustomFieldConfig[] => {
  if (fields.length === 0) return []
  
  // Check if it's already the new format
  if (typeof fields[0] === 'object' && 'name' in fields[0]) {
    return fields as CustomFieldConfig[]
  }
  
  // Convert old format to new format
  const oldFields = fields as string[]
  const fieldConfigs: Record<string, CustomFieldConfig> = {
    brand: { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g., Apple, Samsung' },
    model: { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g., iPhone 14 Pro Max' },
    condition: { name: 'condition', label: 'Condition', type: 'select', options: conditionOptions },
    year: { name: 'year', label: 'Year', type: 'number', placeholder: 'e.g., 2023', min: 1900, max: new Date().getFullYear() + 1 },
    mileage: { name: 'mileage', label: 'Mileage (km)', type: 'number', placeholder: 'e.g., 45000' },
    transmission: { name: 'transmission', label: 'Transmission', type: 'select', options: transmissionOptions },
    fuel_type: { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: fuelTypeOptions },
    bedrooms: { name: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: 'e.g., 3', min: 0 },
    bathrooms: { name: 'bathrooms', label: 'Bathrooms', type: 'number', placeholder: 'e.g., 2', min: 0 },
    furnishing: { name: 'furnishing', label: 'Furnishing', type: 'select', options: furnishingOptions },
    availability: { name: 'availability', label: 'Availability', type: 'select', options: availabilityOptions },
  }
  
  return oldFields.map(field => fieldConfigs[field] || { name: field, label: field, type: 'text' })
}

export default function DynamicFormFields({
  formData,
  customFields,
  onInputChange
}: DynamicFormFieldsProps) {
  const normalizedFields = normalizeCustomFields(customFields)
  
  if (normalizedFields.length === 0) return null

  const handleArrayAdd = (fieldName: string) => {
    const current = formData[fieldName] || []
    onInputChange(fieldName, [...current, {}])
  }

  const handleArrayRemove = (fieldName: string, index: number) => {
    const current = formData[fieldName] || []
    onInputChange(fieldName, current.filter((_: any, i: number) => i !== index))
  }

  const handleArrayItemChange = (fieldName: string, index: number, key: string, value: any) => {
    const current = formData[fieldName] || []
    const updated = [...current]
    updated[index] = { ...updated[index], [key]: value }
    onInputChange(fieldName, updated)
  }

  const renderField = (field: CustomFieldConfig) => {
    const value = formData[field.name]

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={value || ''}
              onChange={(e) => onInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={value || ''}
              onChange={(e) => onInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              type="number"
              min={field.min}
              max={field.max}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => onInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Select value={value || ''} onValueChange={(val) => onInputChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => onInputChange(field.name, checked === true)}
            />
            <label htmlFor={field.name} className="text-sm text-gray-900 cursor-pointer">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        )

      case 'tags':
        return (
          <TagsInput
            key={field.name}
            value={value}
            onChange={(tags) => onInputChange(field.name, tags)}
            placeholder={field.placeholder}
            label={field.label}
            required={field.required}
          />
        )

      case 'array':
        const arrayValue = Array.isArray(value) ? value : []
        return (
          <div key={field.name} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleArrayAdd(field.name)}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add {field.label}
              </Button>
            </div>
            
            {arrayValue.length === 0 && (
              <p className="text-sm text-gray-500">No {field.label.toLowerCase()} added yet. Click "Add {field.label}" to add one.</p>
            )}
            
            {arrayValue.map((item: any, index: number) => (
              <div key={index} className="border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{field.label} #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove(field.name, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Render sub-fields based on children configuration */}
                {field.children && field.children.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {field.children.map((childField) => (
                      <div key={childField.name}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {childField.label} {childField.required && <span className="text-red-500">*</span>}
                        </label>
                        {/* If options are provided, render as select regardless of type */}
                        {childField.options && childField.options.length > 0 ? (
                          <Select
                            value={item[childField.name] || ''}
                            onValueChange={(val) => handleArrayItemChange(field.name, index, childField.name, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={childField.placeholder || `Select ${childField.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {childField.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : childField.type === 'number' ? (
                          <Input
                            value={item[childField.name] || ''}
                            onChange={(e) => handleArrayItemChange(field.name, index, childField.name, e.target.value)}
                            placeholder={childField.placeholder}
                            type="number"
                            min={childField.min}
                            max={childField.max}
                          />
                        ) : childField.type === 'textarea' ? (
                          <textarea
                            value={item[childField.name] || ''}
                            onChange={(e) => handleArrayItemChange(field.name, index, childField.name, e.target.value)}
                            placeholder={childField.placeholder}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                          />
                        ) : (
                          <Input
                            value={item[childField.name] || ''}
                            onChange={(e) => handleArrayItemChange(field.name, index, childField.name, e.target.value)}
                            placeholder={childField.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Default: single text input per array item
                  <Input
                    value={item.value || item.title || item.name || ''}
                    onChange={(e) => handleArrayItemChange(field.name, index, 'value', e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {normalizedFields.map((field) => renderField(field))}
    </div>
  )
}
