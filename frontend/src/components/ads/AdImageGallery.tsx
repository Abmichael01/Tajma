"use client"

import React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'


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
    <div className={`bg-white border border-gray-200 overflow-hidden rounded-3xl ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <motion.div
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
          className="flex h-full"
        >
          {images.map((image, index) => (
            <div key={index} className="relative w-full h-full flex-shrink-0">
              <Image
                src={getMediaUrl(image)}
                alt={`${title} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority={index === currentIndex}
              />
            </div>
          ))}
        </motion.div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 text-sm rounded-full">
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
                className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors rounded-xl ${
                  index === currentIndex 
                    ? 'border-secondary' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={getMediaUrl(image)}

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

