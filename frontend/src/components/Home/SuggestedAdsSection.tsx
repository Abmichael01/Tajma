"use client"

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Eye, ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react'
import { useSuggestedAds } from '@/hooks/useAds'
import { getMediaUrl } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SuggestedAdsSectionProps {
    className?: string
}

export default function SuggestedAdsSection({ 
    className = "" 
}: SuggestedAdsSectionProps) {
    const { data: ads, isLoading, isError } = useSuggestedAds()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const checkScrollButtons = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
    }

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.addEventListener('scroll', checkScrollButtons, { passive: true })
        checkScrollButtons()
        return () => el.removeEventListener('scroll', checkScrollButtons)
    }, [ads])

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return
        const amount = scrollRef.current.clientWidth * 0.75
        scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    }

    if (isLoading) {
        return (
            <div className={`py-10 ${className}`}>
                <div className="container px-4 flex flex-col items-center justify-center min-h-[160px]">
                    <Loader2 className="w-7 h-7 text-secondary animate-spin mb-3" />
                    <p className="text-gray-400 text-sm animate-pulse">Finding things you'll love...</p>
                </div>
            </div>
        )
    }

    if (isError || !ads || ads.length === 0) return null

    return (
        <motion.section
            className={`py-10 ${className}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="container px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">Suggested for you</h2>
                        <p className="text-gray-500 text-sm">Based on your recent activity and interests</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Scroll Buttons */}
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className={`p-2 rounded-full border transition-all ${
                                canScrollLeft
                                    ? 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className={`p-2 rounded-full border transition-all ${
                                canScrollRight
                                    ? 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* See More */}
                        <Link
                            href="/search"
                            className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group"
                        >
                            See more
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Horizontal Scroll Row */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {ads.map((ad, index) => (
                        <motion.div
                            key={ad.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="snap-start flex-none w-[220px] sm:w-[240px]"
                        >
                            <Link href={`/ads/${ad.slug}`} className="block h-full group">
                                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 h-full flex flex-col">
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                        <Image
                                            src={getMediaUrl(ad.images?.[0])}

                                            alt={ad.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="240px"
                                            unoptimized
                                        />
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide text-secondary shadow-sm">
                                            {ad.category_details?.name || 'New'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-secondary transition-colors text-sm leading-snug mb-2">
                                            {ad.title}
                                        </h3>

                                        {ad.price && (
                                            <div className="text-secondary font-bold text-base mb-3">
                                                {ad.currency || 'XOF'} {parseFloat(String(ad.price)).toLocaleString()}
                                            </div>
                                        )}

                                        <div className="flex items-center text-gray-400 text-xs mt-auto pt-3 border-t border-gray-50">
                                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                            <span className="truncate">{ad.seller?.location || 'Niger'}</span>
                                            <span className="mx-1.5">·</span>
                                            <Eye className="w-3 h-3 mr-0.5" />
                                            {ad.views || 0}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* See More card at the end */}
                    <div className="snap-start flex-none w-[160px] flex items-stretch">
                        <Link
                            href="/search"
                            className="flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-secondary hover:text-secondary transition-all group gap-2"
                        >
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            <span className="text-xs font-medium">See more</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile See More */}
                <div className="mt-4 flex sm:hidden">
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group"
                    >
                        See more <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.section>
    )
}
