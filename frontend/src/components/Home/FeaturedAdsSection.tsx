"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Eye, Heart, ArrowRight } from 'lucide-react'
import type { Ad } from '@/api/types'

interface FeaturedAdsSectionProps {
    title: string
    subtitle?: string
    ads: Ad[]
    viewAllLink: string
    className?: string
}

export default function FeaturedAdsSection({ 
    title, 
    subtitle, 
    ads, 
    viewAllLink,
    className = "" 
}: FeaturedAdsSectionProps) {
    if (!ads || ads.length === 0) return null

    return (
        <div className={`py-8 sm:py-12 ${className}`}>
            <div className="container px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                        {subtitle && <p className="text-gray-500 text-sm sm:text-base">{subtitle}</p>}
                    </div>
                    <Link href={viewAllLink} className="inline-flex items-center text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors group">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ads.slice(0, 4).map((ad) => (
                         <Link key={ad.id} href={`/ads/${ad.slug}`} className="block h-full">
                            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
                                {/* Image */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                    <Image
                                        src={ad.images && ad.images.length > 0 ? ad.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'}
                                        alt={ad.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-900 shadow-sm">
                                        {ad.category_details?.name || 'Item'}
                                    </div>
                                    {ad.price && (
                                        <div className="absolute bottom-3 right-3 bg-secondary text-white px-2 py-1 rounded-md text-sm font-bold shadow-sm">
                                            {ad.currency || 'Fr'} {parseFloat(String(ad.price)).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
                                        {ad.title}
                                    </h3>
                                    
                                    {/* Location */}
                                    <div className="flex items-center text-gray-500 text-xs mb-3">
                                        <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                        <span className="truncate">{ad.seller?.location || 'Location not specified'}</span>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                        <span>{new Date(ad.created_at || Date.now()).toLocaleDateString()}</span>
                                        <div className="flex items-center">
                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                            {ad.views || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
