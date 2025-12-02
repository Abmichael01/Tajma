"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { useCategories } from '@/hooks/useCategories'

export default function CategoryGrid() {
  const { categoryTree, loading, error } = useCategories()

  const categories = useMemo(() => {
    return categoryTree.slice(0, 9)
  }, [categoryTree])

  return (
    <section className="py-6 sm:py-8 lg:hidden">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Browse Categories</h2>
            <p className="text-xs text-gray-500">Live data from the marketplace taxonomy.</p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-secondary hover:text-secondary/80"
          >
            View all
          </Link>
        </div>

        {loading && (
          <div className="py-6 flex justify-center">
            <MarketplaceLoader inline size="sm" message="Loading categories..." />
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-sm text-gray-500">No categories available yet.</div>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl border-gray-200 hover:border-secondary/50 hover:shadow-md transition-all text-secondary"
              >
                <div className="mb-2 text-secondary">
                  {getCategoryIcon(category.icon || 'Package', 'w-6 h-6', 24)}
                </div>
                <span className="text-sm font-semibold text-center text-gray-900">
                  {category.name}
                </span>
                {typeof category.adsCount === 'number' && (
                  <span className="text-[11px] text-gray-500 mt-1">
                    {category.adsCount} ads
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

