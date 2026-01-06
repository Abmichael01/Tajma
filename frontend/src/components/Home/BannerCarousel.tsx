"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export type CarouselSlideType = 'category' | 'ad'

export interface CarouselSlide {
    id: string
    type: CarouselSlideType
    title: string
    subtitle?: string
    description?: string
    image?: string
    ctaText?: string
    ctaLink: string
    backgroundColor?: string
    textColor?: string
}

interface BannerCarouselProps {
    slides: CarouselSlide[]
    autoPlayInterval?: number
}

export default function BannerCarousel({ 
    slides, 
    autoPlayInterval = 5000 
}: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        if (!slides.length) return

        const timer = setInterval(() => {
            nextSlide()
        }, autoPlayInterval)

        return () => clearInterval(timer)
    }, [currentIndex, slides.length, autoPlayInterval])

    const nextSlide = () => {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    const swipeConfidenceThreshold = 10000
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity
    }

    if (!slides.length) return null

    const currentSlide = slides[currentIndex]

    return (
        <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-100">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x)

                        if (swipe < -swipeConfidenceThreshold) {
                            nextSlide()
                        } else if (swipe > swipeConfidenceThreshold) {
                            prevSlide()
                        }
                    }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center p-6 sm:p-12 md:p-16"
                    style={{ 
                        background: currentSlide.backgroundColor?.includes('gradient') 
                            ? currentSlide.backgroundColor 
                            : (currentSlide.backgroundColor || '#f3f4f6'), 
                        color: currentSlide.textColor || '#1f2937',
                        backgroundImage: currentSlide.image ? `url(${currentSlide.image})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Dark Overlay for better text readability if image exists */}
                    {currentSlide.image && (
                        <div className="absolute inset-0 bg-black/40 z-0" />
                    )}

                    <div className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="text-left space-y-4 md:space-y-6">
                            {currentSlide.subtitle && (
                                <motion.span 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${currentSlide.image ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-secondary/10 text-secondary'}`}
                                >
                                    {currentSlide.subtitle}
                                </motion.span>
                            )}
                            
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${currentSlide.image ? 'text-white' : ''}`}
                            >
                                {currentSlide.title}
                            </motion.h2>

                            {currentSlide.description && (
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className={`text-base sm:text-lg md:text-xl max-w-lg ${currentSlide.image ? 'text-gray-200' : 'text-gray-600'}`}
                                >
                                    {currentSlide.description}
                                </motion.p>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Link href={currentSlide.ctaLink}>
                                    <Button 
                                        size="lg" 
                                        className={`rounded-full px-8 font-semibold text-base shadow-lg hover:shadow-xl transition-all ${
                                            currentSlide.image 
                                              ? 'bg-white text-gray-900 hover:bg-gray-100' 
                                              : 'bg-secondary hover:bg-secondary/90 text-white'
                                        }`}
                                    >
                                        {currentSlide.ctaText || 'View Details'}
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden group-hover:block md:block">
                <button 
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 text-white transition-all shadow-sm border border-white/20"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden group-hover:block md:block">
                <button 
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 text-white transition-all shadow-sm border border-white/20"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1)
                            setCurrentIndex(index)
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex 
                                ? 'w-8 bg-secondary' 
                                : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                    />
                ))}
            </div>
        </div>
    )
}
