"use client"

import React, { useMemo, useState } from 'react'
import { Link } from '@/i18n/routing'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import CategoryImage from '@/components/ui/CategoryImage'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import { CategoryTree } from '@/types/category'
import { useTranslations } from 'next-intl'

export default function CategoriesSection() {
  const t = useTranslations('common')
  const { categoryTree, loading } = useCategories()
  const [hoveredCategory, setHoveredCategory] = useState<CategoryTree | null>(null)
  const [hoveredCategoryTop, setHoveredCategoryTop] = useState<number>(0)

  const displayedCategories = useMemo(() => categoryTree, [categoryTree])

  return (
    <div
      className="hidden lg:flex flex-col lg:min-w-[260px] lg:max-w-[320px] bg-white border border-gray-200 rounded-xl p-5 relative z-40 h-full categories-section-container"
      onMouseLeave={() => setHoveredCategory(null)}
    >
      <h3 className="font-semibold text-gray-900 mb-1">{t('categories')}</h3>
      <p className="text-[11px] text-gray-500 mb-4">{t('hover_preview')}</p>

      <div className="flex-1 space-y-0.5 custom-scrollbar-categories pr-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="space-y-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2.5">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-[70%] rounded-full" />
                  <Skeleton className="h-2 w-[40%] rounded-full" />
                </div>
                <Skeleton className="w-4 h-4 rounded-full opacity-20" />
              </div>
            ))}
          </div>
        )}

        {!loading && displayedCategories.length === 0 && (
          <div className="text-sm text-gray-500">{t('no_categories')}</div>
        )}

        {displayedCategories.map((category) => {
          const totalCount = category.adsCount || 0
          const isHovered = hoveredCategory?.id === category.id

          return (
            <div 
              key={category.id} 
              className="relative"
              onMouseEnter={(e) => {
                setHoveredCategory(category)
                const rect = e.currentTarget.getBoundingClientRect()
                const container = e.currentTarget.closest('.categories-section-container')
                if (container) {
                  const containerRect = container.getBoundingClientRect()
                  setHoveredCategoryTop(rect.top - containerRect.top)
                }
              }}
            >
              <Link href={`/category/${category.slug}`}>
                <div className={cn(
                  "flex items-center gap-3 py-2 px-2.5 cursor-pointer group w-full transition-all duration-200 rounded-lg",
                  isHovered ? "bg-primary/5 translate-x-1" : "hover:bg-gray-50"
                )}>
                  <CategoryImage 
                      imageUrl={category.imageUrl} 
                      name={category.name}
                      size={32}
                      className="w-8 h-8 flex-shrink-0"
                  />
                  <div className="flex-1 w-0">
                    <p className={cn(
                      "text-sm font-medium transition-colors truncate",
                      isHovered ? "text-primary" : "text-gray-700 group-hover:text-primary"
                    )}>
                      {category.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-normal">{totalCount} {t('listings')}</p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-200",
                    isHovered ? "text-primary opacity-100" : "text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100"
                  )} />
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Flyout Subcategories Menu - Now outside the overflow container */}
      {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
        <div 
          className="absolute left-full pl-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
          style={{ top: hoveredCategoryTop }}
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        >
          <div className="w-64 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{hoveredCategory.name}</span>
              <span className="text-[10px] text-gray-400">{hoveredCategory.children?.length} {t('subcategories')}</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {hoveredCategory.children?.slice(0, 10).map((sub) => (
                <Link 
                  key={sub.id} 
                  href={`/category/${sub.slug}`}
                  className="text-sm text-gray-600 hover:text-primary hover:bg-primary/5 px-2 py-1.5 rounded-md transition-all flex items-center justify-between group/sub"
                >
                  <span className="truncate">{sub.name}</span>
                  <span className="text-[10px] text-gray-400 group-hover/sub:text-primary/70">{sub.adsCount || 0}</span>
                </Link>
              ))}
              {hoveredCategory.children && hoveredCategory.children.length > 10 && (
                <Link 
                  href={`/category/${hoveredCategory.slug}`}
                  className="text-[11px] text-primary font-medium mt-2 px-2 hover:underline"
                >
                  {t('view_all_subcategories')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
