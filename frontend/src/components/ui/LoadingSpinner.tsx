import React from 'react'
import MarketplaceLoader from './MarketplaceLoader'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <MarketplaceLoader size={size} message={text} />
    </div>
  )
}

