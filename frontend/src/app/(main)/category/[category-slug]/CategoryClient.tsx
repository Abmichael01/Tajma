"use client"

import React from 'react'

interface CategoryClientProps {
  categorySlug: string
}

export default function CategoryClient({ categorySlug }: CategoryClientProps) {
  // Format category name for display
  const categoryName = categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {categoryName}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              This feature will be done soon~
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
