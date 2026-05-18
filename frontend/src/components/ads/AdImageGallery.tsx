"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import AdImageViewer from './AdImageViewer'

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
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  return (
    <>
      <div className={`relative bg-white border border-gray-200 overflow-hidden rounded-xl ${className}`}>
        {/* Main Image */}
        <div
          className="relative aspect-video bg-gray-100 overflow-hidden cursor-zoom-in group/gallery"
          onClick={() => setIsViewerOpen(true)}
        >
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

          {/* Zoom Overlay (hover hint) */}
          <div className="absolute inset-0 bg-black/0 group-hover/gallery:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 pointer-events-none">
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
              <Maximize2 className="w-6 h-6" />
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPrev()
                }}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 text-sm rounded-full z-10">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Title overlay — gradient mask at the bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pt-12 pb-4 pointer-events-none">
            <h2 className="text-white text-base sm:text-lg md:text-xl font-semibold leading-tight line-clamp-2 drop-shadow">
              {title}
            </h2>
          </div>
        </div>

        {/* Thumbnail Navigation — tight to the image, no divider */}
        {images.length > 1 && (
          <div className="px-3 py-3 bg-white">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onThumbnailClick(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all rounded-lg ${
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary/20 scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
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

      <AdImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        currentIndex={currentIndex}
        onPrev={onPrev}
        onNext={onNext}
        title={title}
      />
    </>
  )
}

