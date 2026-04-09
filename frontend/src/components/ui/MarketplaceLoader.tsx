'use client'

import React from 'react'

interface MarketplaceLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean // For inline use in buttons
  color?: string // Custom color class (e.g., 'bg-blue-500', 'bg-primary', etc.)
  white?: boolean // Use white color (useful for buttons with colored backgrounds)
}

export default function MarketplaceLoader({ 
  message, 
  size = 'md',
  inline = false,
  color = 'bg-primary',
  white = false
}: MarketplaceLoaderProps) {
  // Extract text color from bg color class, or use white
  const actualColor = white ? 'text-white' : color.replace('bg-', 'text-')
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const spinner = (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${actualColor}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-20" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="3.5"
      ></circle>
      <path 
        className="opacity-80" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )

  if (inline) {
    return (
      <div className="flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {message && (
        <p className={`text-sm font-medium ${white ? 'text-white/90' : 'text-gray-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
