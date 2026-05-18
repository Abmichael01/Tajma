"use client"

import React, { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMediaUrl } from '@/lib/utils'

interface AdImageViewerProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  title: string
}

export default function AdImageViewer({
  isOpen,
  onClose,
  images,
  currentIndex,
  onPrev,
  onNext,
  title
}: AdImageViewerProps) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
    if (e.key === 'Escape') onClose()
  }, [onPrev, onNext, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[110]">
          <div className="text-white">
            <h3 className="font-medium text-lg truncate max-w-[200px] sm:max-w-md">{title}</h3>
            <p className="text-sm text-gray-400">{currentIndex + 1} / {images.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="absolute left-4 z-[120] p-3 text-white/70 hover:text-white disabled:opacity-0 bg-black/40 hover:bg-black/60 rounded-full transition-all backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={onNext}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 z-[120] p-3 text-white/70 hover:text-white disabled:opacity-0 bg-black/40 hover:bg-black/60 rounded-full transition-all backdrop-blur-sm border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <Image
                  src={getMediaUrl(images[currentIndex])}
                  alt={`${title} - ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                  quality={100}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Thumbnails Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 overflow-x-auto">
            <div className="flex gap-2 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle thumbnail click if we want to add an onGoToIndex prop
                  }}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === currentIndex ? 'border-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={getMediaUrl(img)}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
