"use client"

import React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdImageGalleryProps {
  images: string[]
  title: string
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  onThumbnailClick: (index: number) => void
  className?: string
}

export default function AdImageGallery({
  images,
  title,
  currentIndex,
  onPrev,
  onNext,
  onThumbnailClick,
  className = ''
}: AdImageGalleryProps) {
  return (
    <div className={`bg-white border border-gray-200 overflow-hidden ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={images[currentIndex]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onThumbnailClick(index)}
                className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                  index === currentIndex 
                    ? 'border-secondary' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={image}
                  alt={`${title} ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

