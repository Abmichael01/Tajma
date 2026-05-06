"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check } from 'lucide-react'
import CategoryPicker from './CategoryPicker'
import { useTranslations } from 'next-intl'
import AdTypeIndicator from './AdTypeIndicator'
import CategoryImage from '@/components/ui/CategoryImage'
import type { CategoryTree } from '@/types/category'
import { cn } from '@/lib/utils'

interface BasicInfoStepProps {
  formData: any
  errors: any
  categoryTree: CategoryTree[]
  categoryPath: string[]
  onCategorySelect: (category: CategoryTree, path: string[]) => void
  onInputChange: (field: any, value: any) => void
  selectedCategoryLabel?: string
  isEditMode?: boolean
}

export default function BasicInfoStep({
  formData,
  errors,
  categoryTree,
  categoryPath,
  onCategorySelect,
  onInputChange,
  selectedCategoryLabel,
  isEditMode = false
}: BasicInfoStepProps) {
  const t = useTranslations('create_ad')
  const [isChangingCategory, setIsChangingCategory] = React.useState(false)

  const selectedCategory = React.useMemo(() => {
    if (!formData.category || !categoryTree.length) return null
    
    const findNode = (nodes: CategoryTree[], slug: string): CategoryTree | null => {
      for (const node of nodes) {
        if (node.slug === slug) return node
        if (node.children?.length) {
          const found = findNode(node.children, slug)
          if (found) return found
        }
      }
      return null
    }
    
    return findNode(categoryTree, formData.category)
  }, [formData.category, categoryTree])

  return (
    <div className="space-y-8">
      {/* Title & Introduction */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900">{t('basic_info')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode ? t('update_ad_details') : t('tell_us_about_posting')}
          </p>
        </div>
        {formData.adType && <AdTypeIndicator adType={formData.adType} />}
      </div>

      {/* 1. Ad Title (First, matching mobile) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600 flex items-center justify-between">
          <span>
            {formData.adType === 'cv'
                ? t('professional_title')
                : formData.adType === 'job'
                ? t('job_title')
                : t('ad_title')}{' '}
            <span className="text-red-500 font-normal">*</span>
          </span>
          <span className={cn(
             "text-[10px] font-medium transition-colors",
             formData.title.length > 90 ? "text-orange-500" : "text-gray-300"
          )}>
            {formData.title.length}/100
          </span>
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
          className={cn(
            "h-14 px-6 rounded-full text-base font-medium border-gray-200 focus:border-primary focus:ring-primary/20 transition-all shadow-none",
            errors.title ? 'border-red-500 bg-red-50/30' : 'bg-gray-50/30'
          )}
          maxLength={100}
        />
        {errors.title && <p className="text-red-500 text-xs font-medium px-2">{errors.title}</p>}
      </div>

      {/* 2. Category Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {t('category')} <span className="text-red-500 font-normal">*</span>
          {formData.category && !isChangingCategory && (
             <Button 
                type="button" 
                variant="link" 
                size="sm" 
                onClick={() => setIsChangingCategory(true)}
                className="h-auto p-0 text-xs text-primary font-medium hover:text-primary/80"
             >
                {t('change')}
             </Button>
          )}
        </label>
        
        {isEditMode || (formData.category && !isChangingCategory) ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-none hover:bg-gray-50/50 transition-all group">
                <CategoryImage 
                    imageUrl={selectedCategory?.imageUrl} 
                    name={selectedCategory?.name}
                    size={48} 
                    className="w-12 h-12 rounded-full border border-gray-100 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-400 tracking-tight">{t('selected_category')}</p>
                    <p className="text-base font-medium text-gray-900 truncate">
                        {selectedCategoryLabel || '—'}
                    </p>
                </div>
                {(isEditMode || formData.category) && !isChangingCategory && (
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsChangingCategory(true)}
                        className="text-xs font-medium text-primary hover:bg-primary/5 rounded-full px-4"
                    >
                        {t('edit')}
                    </Button>
                )}
             </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <CategoryPicker 
                categoryTree={categoryTree}
                initialPath={categoryPath}
                onSelect={(cat: CategoryTree, path: string[]) => {
                    onCategorySelect(cat, path)
                    setIsChangingCategory(false)
                }}
            />
          </div>
        )}
        {errors.category && <p className="text-red-500 text-xs font-medium bg-red-50 py-2.5 px-5 rounded-full inline-block">{errors.category}</p>}
      </div>
    </div>
  )
}
