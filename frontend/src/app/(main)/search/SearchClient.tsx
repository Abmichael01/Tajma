"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">
              {query ? `Search results for "${query}"` : 'Search Results'}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6">
              This feature will be done soon~
            </p>
            {location && (
              <p className="text-sm text-gray-500">
                Location: {location}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
