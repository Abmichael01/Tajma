"use client"

import React, { useMemo, useState } from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useCategories } from '@/hooks/useCategories'
import { cn, getMediaUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface CategoryCardProps {
  category: {
    id: string
    slug: string
    name: string
    imageUrl?: string | null
    adsCount?: number
  }
}

function CategoryCard({ category }: CategoryCardProps) {
  const t = useTranslations('common')
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const fullImageUrl = getMediaUrl(category.imageUrl || undefined)

  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex flex-col bg-white border rounded-xl border-gray-200 hover:border-secondary/50 hover:shadow-md transition-all text-secondary overflow-hidden"
    >
      {/* Image at top - fills width, rectangular */}
      <div className="relative w-full h-20 bg-gray-100 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        {fullImageUrl && !fullImageUrl.includes('placeholder.com') && !imageError ? (
          <Image
            src={fullImageUrl}
            alt={category.name ? `${category.name} category` : 'Category'}
            width={120}
            height={80}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="w-8 h-8 rounded bg-gray-300" />
          </div>
        )}
      </div>
      
      {/* Text content below image */}
      <div className="flex flex-col items-center justify-center p-3 pt-2">
        <span className="text-xs font-semibold text-center text-gray-900 leading-tight">
          {category.name}
        </span>
        {typeof category.adsCount === 'number' && (
          <span className="text-[10px] text-gray-500 mt-0.5">
            {category.adsCount} {t('ads_count')}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function CategoryGrid() {
  const t = useTranslations('common')
  const { categoryTree, loading, error } = useCategories()

  const categories = useMemo(() => {
    return categoryTree.slice(0, 9)
  }, [categoryTree])

  return (
    <section className="py-6 sm:py-8 lg:hidden">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{t('categories')}</h2>
            <p className="text-xs text-gray-500">{t('hover_preview')}</p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-secondary hover:text-secondary/80"
          >
            {t('view_all')}
          </Link>
        </div>

        {loading && (
          <div className="py-6 flex justify-center">
            <MarketplaceLoader inline size="sm" message={t('loading')} />
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-sm text-gray-500">{t('no_categories')}</div>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

