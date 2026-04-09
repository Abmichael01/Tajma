"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { cn, getMediaUrl } from '@/lib/utils'

interface CategoryImageProps {
  imageUrl?: string | null
  name?: string
  size?: number
  className?: string
  fallbackClassName?: string
}

export default function CategoryImage({
  imageUrl,
  name,
  size = 48,
  className = '',
  fallbackClassName = '',
}: CategoryImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const fullImageUrl = getMediaUrl(imageUrl || undefined)

  // Show skeleton if no image or error
  if (!fullImageUrl || fullImageUrl.includes('placeholder.com') || imageError) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-200 animate-pulse flex items-center justify-center',
          className,
          fallbackClassName
        )}
        style={{ width: size, height: size }}
        aria-label={name ? `Category image for ${name}` : 'Category image'}
      >
        <div className="w-full h-full rounded-full bg-gray-300" />
      </div>
    )
  }

  return (
    <div
      className={cn('relative overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {imageLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-full"
          style={{ width: size, height: size }}
        />
      )}
      <Image
        src={fullImageUrl}
        alt={name ? `${name} category` : 'Category'}
        width={size}
        height={size}
        className={cn(
          'object-cover rounded-full transition-opacity duration-300',
          imageLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        unoptimized
      />
    </div>
  )
}

