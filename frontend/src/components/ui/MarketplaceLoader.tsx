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
  message = 'Authenticating your account....', 
  size = 'md',
  inline = false,
  color = 'bg-primary',
  white = false
}: MarketplaceLoaderProps) {
  // Determine the actual color to use
  const actualColor = white ? 'bg-white' : color
  const textColor = white ? 'text-white' : color.replace('bg-', 'text-')
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  }

  const containerSize = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  }
  
  // Grid gap for each size
  const gridGap = {
    sm: 'gap-0.5', // 0.125rem (2px)
    md: 'gap-1',   // 0.25rem (4px)
    lg: 'gap-1.5'  // 0.375rem (6px)
  }

  // Inline version for buttons
  if (inline) {
    return (
      <div className="relative w-5 h-5 flex items-center justify-center">
        <div className="relative w-full h-full grid grid-cols-2 gap-0.5">
          {/* Subtle glow effect */}
          <div 
            className={`absolute inset-0 ${actualColor}/20 rounded-full blur-sm -z-10`}
            style={{
              animation: 'glow-pulse 2s ease-in-out infinite'
            }}
          />
          {/* 4 small squares in grid */}
          <div 
            className={`w-1.5 h-1.5 ${actualColor} z-10`}
            style={{
              animation: 'pulse-corner 1.4s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <div 
            className={`w-1.5 h-1.5 ${actualColor} z-10`}
            style={{
              animation: 'pulse-corner 1.4s ease-in-out infinite',
              animationDelay: '0.35s'
            }}
          />
          <div 
            className={`w-1.5 h-1.5 ${actualColor} z-10`}
            style={{
              animation: 'pulse-corner 1.4s ease-in-out infinite',
              animationDelay: '0.7s'
            }}
          />
          <div 
            className={`w-1.5 h-1.5 ${actualColor} z-10`}
            style={{
              animation: 'pulse-corner 1.4s ease-in-out infinite',
              animationDelay: '1.05s'
            }}
          />
          {/* Animated connecting path */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            style={{ zIndex: 5 }}
            viewBox="0 0 20 20"
            preserveAspectRatio="none"
          >
            <path
              d="M 2 2 L 18 2 L 18 18 L 2 18 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className={`${textColor}/30`}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0 100"
              style={{
                animation: 'draw-path 2s ease-in-out infinite'
              }}
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated loader with 4 squares */}
      <div className={`relative ${containerSize[size]} grid grid-cols-2 ${gridGap[size]}`}>
        {/* Subtle pulsing glow effect */}
        <div 
          className={`absolute inset-0 ${actualColor}/15 rounded-full blur-md -z-10`}
          style={{
            animation: 'glow-pulse 2s ease-in-out infinite',
            transform: 'scale(1.5)'
          }}
        />
        
        {/* Animated connecting path - draws a square connecting the corners */}
        <svg 
          className={`absolute inset-0 ${containerSize[size]}`}
          style={{ zIndex: 5 }}
          viewBox="0 0 24 24"
          preserveAspectRatio="none"
        >
          <path
            d="M 3 3 L 21 3 L 21 21 L 3 21 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`${textColor}/20`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0 100"
            style={{
              animation: 'draw-path 2s ease-in-out infinite'
            }}
          />
        </svg>
        
        {/* 4 Squares in grid layout */}
        <div 
          className={`${sizeClasses[size]} ${actualColor} z-10 shadow-sm`}
          style={{
            animation: 'pulse-corner 1.4s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className={`${sizeClasses[size]} ${actualColor} z-10 shadow-sm`}
          style={{
            animation: 'pulse-corner 1.4s ease-in-out infinite',
            animationDelay: '0.35s'
          }}
        />
        <div 
          className={`${sizeClasses[size]} ${actualColor} z-10 shadow-sm`}
          style={{
            animation: 'pulse-corner 1.4s ease-in-out infinite',
            animationDelay: '0.7s'
          }}
        />
        <div 
          className={`${sizeClasses[size]} ${actualColor} z-10 shadow-sm`}
          style={{
            animation: 'pulse-corner 1.4s ease-in-out infinite',
            animationDelay: '1.05s'
          }}
        />
      </div>
      
      {/* Loading message */}
      {message && (
        <p className={`text-sm font-medium ${white ? 'text-white' : 'text-gray-600'}`}>{message}</p>
      )}
    </div>
  )
}

