"use client"

import React from 'react'
import Image from 'next/image'
import { getEmojiImageUrl } from '@/utils/emojiToImage'

interface EmojiImageProps {
  emoji: string
  size?: number
  className?: string
  alt?: string
}

export default function EmojiImage({ 
  emoji, 
  size = 24, 
  className = '',
  alt = 'Category icon'
}: EmojiImageProps) {
  // Validate emoji input
  if (!emoji || typeof emoji !== 'string') {
    return null
  }

  const imageUrl = getEmojiImageUrl(emoji, size)
  
  if (!imageUrl) {
    // Fallback to text emoji if conversion fails
    return <span className={className}>{emoji}</span>
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      className={className}
      unoptimized // Twemoji CDN already optimized
    />
  )
}

