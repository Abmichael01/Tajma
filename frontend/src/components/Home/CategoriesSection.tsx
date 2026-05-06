"use client"

import React, { useMemo, useState } from 'react'
import { Link } from '@/i18n/routing'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
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
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollHeight, setScrollHeight] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Dropdown scroll state
  const [dropScrollTop, setDropScrollTop] = useState(0)
  const [dropScrollHeight, setDropScrollHeight] = useState(0)
  const [dropIsAtBottom, setDropIsAtBottom] = useState(true)
  const dropScrollRef = React.useRef<HTMLDivElement>(null)

  const displayedCategories = useMemo(() => categoryTree, [categoryTree])

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const updateScrollState = () => {
        setScrollHeight(el.scrollHeight);
        setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
      };
      // Check initially and whenever categories change
      updateScrollState();
      // Also check on window resize
      window.addEventListener('resize', updateScrollState);
      return () => window.removeEventListener('resize', updateScrollState);
    }
  }, [displayedCategories]);

  // Reset dropdown scroll state when hovered category changes
  React.useEffect(() => {
    const el = dropScrollRef.current;
    if (el) {
      el.scrollTop = 0;
      setDropScrollTop(0);
      setDropScrollHeight(el.scrollHeight);
      setDropIsAtBottom(el.scrollHeight <= el.clientHeight);
    }
  }, [hoveredCategory]);

  return (
    <div
      className="hidden lg:flex flex-col w-full bg-white border border-gray-200 rounded-xl py-5 relative z-40 h-full categories-section-container"
      onMouseLeave={() => setHoveredCategory(null)}
    >
      <div className="px-5">
        <h3 className="font-semibold text-gray-900 mb-1">{t('categories')}</h3>
        <p className="text-[11px] text-gray-500 mb-4">{t('hover_preview')}</p>
      </div>

      <div className="relative flex-1 min-h-0">
        {/* Top Fade + Chevron Up */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-start justify-center pt-1.5",
            scrollTop > 0 ? "opacity-100" : "opacity-0"
          )} 
        >
          <div className="bg-white border border-gray-200 shadow-sm rounded-full p-0.5">
            <ChevronUp className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        <div 
          ref={scrollRef}
          onScroll={(e) => {
            const target = e.currentTarget;
            setScrollTop(target.scrollTop);
            setIsAtBottom(target.scrollTop + target.clientHeight >= target.scrollHeight - 2);
          }}
          className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
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
                  "flex items-center gap-3 py-2.5 px-5 cursor-pointer group w-full transition-colors duration-200",
                  isHovered ? "bg-primary/5" : "hover:bg-gray-50"
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

        {/* Bottom Fade + Chevron Down */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-end justify-center pb-1.5",
            !isAtBottom && scrollHeight > 0 ? "opacity-100" : "opacity-0"
          )} 
        >
          <div className="bg-white border border-gray-200 shadow-sm rounded-full p-0.5">
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Flyout Subcategories Menu */}
      {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
        <div 
          className="absolute top-0 bottom-0 left-full pl-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        >
          <div className="w-[280px] h-full bg-white border border-gray-200 rounded-xl py-4 flex flex-col shadow-lg">
            <div className="mb-3 border-b border-gray-50 pb-2 px-5 flex-shrink-0">
              <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">{hoveredCategory.name}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">{hoveredCategory.children?.length} {t('subcategories')}</span>
            </div>
            
            <div className="flex-1 relative min-h-0 overflow-hidden">
              {/* Dropdown Top Fade + Chevron */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-start justify-center pt-1.5",
                dropScrollTop > 0 ? "opacity-100" : "opacity-0"
              )}>
                <div className="bg-white border border-gray-200 shadow-sm rounded-full p-0.5">
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              <div
                ref={dropScrollRef}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  setDropScrollTop(target.scrollTop);
                  setDropIsAtBottom(target.scrollTop + target.clientHeight >= target.scrollHeight - 2);
                }}
                className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {hoveredCategory.children?.map((sub) => (
                  <Link 
                    key={sub.id} 
                    href={`/category/${sub.slug}`}
                    className="px-5 py-2 transition-colors flex items-center gap-3 hover:bg-primary/5 group/sub border-b border-gray-50 last:border-b-0"
                  >
                    <CategoryImage 
                      imageUrl={sub.imageUrl} 
                      name={sub.name}
                      size={32}
                      className="w-8 h-8 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 block truncate group-hover/sub:text-gray-900">{sub.name}</span>
                      <span className="text-[10px] text-gray-400">{sub.adsCount || 0} {t('listings')}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Dropdown Bottom Fade + Chevron */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-end justify-center pb-1.5",
                !dropIsAtBottom && dropScrollHeight > 0 ? "opacity-100" : "opacity-0"
              )}>
                <div className="bg-white border border-gray-200 shadow-sm rounded-full p-0.5">
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
