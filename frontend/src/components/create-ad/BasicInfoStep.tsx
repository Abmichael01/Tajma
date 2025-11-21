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
import AdTypeIndicator from './AdTypeIndicator'
import { getCategoryIcon } from '@/utils/categoryIcons'
import type { CategoryTree } from '@/types/category'

interface BasicInfoStepProps {
  formData: any
  errors: any
  categoryTree: CategoryTree[]
  categoryPath: string[]
  onCategoryLevelChange: (level: number, slug: string) => void
  onInputChange: (field: any, value: any) => void
  selectedCategoryLabel?: string
  isEditMode?: boolean
}

export default function BasicInfoStep({
  formData,
  errors,
  categoryTree,
  categoryPath,
  onCategoryLevelChange,
  onInputChange,
  selectedCategoryLabel,
  isEditMode = false
}: BasicInfoStepProps) {
  const levelConfigs = React.useMemo(() => {
    const configs: Array<{ level: number; options: CategoryTree[]; value: string }> = []
    let options = categoryTree
    let depth = 0

    if (!options.length) return configs

    while (options && options.length) {
      const value = categoryPath[depth] || ''
      configs.push({ level: depth, options, value })

      if (!value) break
      const selectedNode = options.find((node) => node.slug === value)
      if (selectedNode && selectedNode.children && selectedNode.children.length) {
        options = selectedNode.children
        depth += 1
        continue
      }
      return configs
    }

    const lastConfig = configs[configs.length - 1]
    const lastNode =
      lastConfig && lastConfig.value
        ? lastConfig.options.find((node) => node.slug === lastConfig.value)
        : null

    if (lastNode && lastNode.children && lastNode.children.length) {
      configs.push({
        level: configs.length,
        options: lastNode.children,
        value: categoryPath[configs.length] || '',
      })
    }

    if (configs.length === 0) {
      configs.push({ level: 0, options: categoryTree, value: '' })
    }

    return configs
  }, [categoryTree, categoryPath])

  const isLeafSelected = Boolean(formData.category)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode ? 'Update your ad information' : 'Tell us about what you are posting'}
          </p>
        </div>
        {formData.adType && <AdTypeIndicator adType={formData.adType} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        {isEditMode ? (
          <div className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-700">
            {selectedCategoryLabel || '—'}
          </div>
        ) : (
          <div className="space-y-3">
            {levelConfigs.map(({ level, options, value }) => (
              <Select
                key={level}
                value={value}
                onValueChange={(selected) => onCategoryLevelChange(level, selected)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue
                    placeholder={level === 0 ? 'Select category' : 'Select subcategory'}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {options.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      <span className="flex items-center gap-2">
                        {option.icon && (
                          <span className="flex-shrink-0">
                            {getCategoryIcon(option.icon, 'w-4 h-4', 18)}
                          </span>
                        )}
                        {option.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {formData.adType === 'cv'
            ? 'Professional Title'
            : formData.adType === 'job'
              ? 'Job Title'
              : 'Ad Title'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          placeholder={
            formData.adType === 'cv'
              ? 'e.g., Experienced Full Stack Developer'
              : formData.adType === 'job'
                ? 'e.g., Senior Software Engineer Needed'
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
    </div>
  )
}

