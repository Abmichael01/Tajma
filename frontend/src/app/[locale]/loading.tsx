import React from 'react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <MarketplaceLoader size="lg" message="Loading..." />
    </div>
  )
}

