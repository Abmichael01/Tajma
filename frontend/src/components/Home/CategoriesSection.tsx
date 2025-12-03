"use client"

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import CategoryImage from '@/components/ui/CategoryImage'
import { useCategories } from '@/hooks/useCategories'

export default function CategoriesSection() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const { categoryTree, loading } = useCategories()

  const displayedCategories = useMemo(() => categoryTree, [categoryTree])

  return (
    <div 
      className="hidden lg:block lg:w-[300px] bg-white border border-gray-200 p-5 relative z-10 h-fit"
    >
      <h3 className="font-semibold text-gray-900 mb-1">Browse Categories</h3>
      <p className="text-xs text-gray-500 mb-4">Hover to preview top subcategories.</p>

      <div className="space-y-1 custom-scrollbar-categories pr-1">
        {loading && (
          <div className="py-6 flex justify-center">
            <MarketplaceLoader inline size="sm" message="Loading categories..." />
          </div>
        )}

        {!loading && displayedCategories.length === 0 && (
          <div className="text-sm text-gray-500">No categories available yet.</div>
        )}

        {displayedCategories.map((category) => {
          // Use the category's adsCount directly - backend already calculates total (direct + all children)
          const totalCount = category.adsCount || 0

          return (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center gap-3 py-2.5  border-y border-transparent hover:border-gray-200 hover:bg-white/90 cursor-pointer group w-full transition-colors">
                <CategoryImage
                  imageUrl={category.imageUrl}
                  name={category.name}
                  size={40}
                  className="w-10 h-10 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                    {category.name}
                  </p>
                  <p className="text-[11px] text-gray-500">{totalCount} listings</p>
                </div>
              </div>

              {/* Subcategories Dropdown with Framer Motion */}
              <AnimatePresence>
                {hoveredCategory === category.id && (
                  <motion.div
                    className="absolute left-full top-0 w-72 bg-white border border-gray-200  z-50 p-4 ml-1"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
                      {/* <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <span>{category.name}</span>
                      </div> */}

                      {(category.children || []).map((subcategory, index) => (
                        <motion.div
                          key={subcategory.id}
                          className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors  border border-transparent hover:border-secondary/30"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.1,
                            delay: index * 0.02,
                            ease: 'easeOut',
                          }}
                        >
                          <CategoryImage
                            imageUrl={subcategory.imageUrl || category.imageUrl}
                            name={subcategory.name}
                            size={36}
                            className="w-9 h-9 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{subcategory.name}</p>
                            {subcategory.children && subcategory.children.length > 0 && (
                              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                <ChevronRight className="w-3 h-3" /> {subcategory.children.length} more types
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-secondary bg-secondary/10 px-1.5 py-0.5">
                            {subcategory.adsCount || 0}
                          </span>
                        </motion.div>
                      ))}

                      {(category.children || []).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">
                          No subcategories yet. Check back soon.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
