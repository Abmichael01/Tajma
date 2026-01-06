"use client"

import React, { useState } from 'react'
import SearchBox from '../ui/SearchBox'
import RegionSelectorModal from '../modals/RegionSelectorModal'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import BannerCarousel, { CarouselSlide } from './BannerCarousel'

export default function Hero() {
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState('All Regions')

    const slides: CarouselSlide[] = [
        {
            id: '1',
            type: 'category',
            title: 'Empowering Your Lifestyle',
            subtitle: 'Welcome to Tajma',
            description: 'Discover a premium marketplace for everything you need, from high-end electronics to exclusive real estate.',
            ctaText: 'Explore Marketplace',
            ctaLink: '/categories',
            // Deep Indigo Gradient
            backgroundColor: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)', 
            textColor: '#ffffff'
        },
        {
            id: '2',
            type: 'ad',
            title: 'Tech Frontiers',
            subtitle: 'Innovation Hub',
            description: 'Upgrade your toolkit with cutting-edge devices designed for modern professionals.',
            ctaText: 'Shop Electronics',
            ctaLink: '/category/electronics',
            // Dark Slate Gradient
            backgroundColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            textColor: '#ffffff'
        },
        {
            id: '3',
            type: 'ad',
            title: 'Refined Aesthetics',
            subtitle: 'New Collections',
            description: 'Elevate your personal style with our curated selection of premium fashion.',
            ctaText: 'View Collection',
            ctaLink: '/category/fashion',
            // Emerald Gradient
            backgroundColor: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
            textColor: '#ffffff'
        }
    ]

    return (
        <>
            <section className="relative bg-white pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pb-20 overflow-visible">
                <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                    
                    {/* Banner Carousel */}
                    <div className="mb-8 sm:mb-12 relative rounded-2xl overflow-hidden shadow-sm">
                        <BannerCarousel slides={slides} />
                    </div>

                    {/* Search Box with State Selector - Overlapping or Just Below */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-lg sm:max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-2 -mt-16 sm:-mt-20 relative z-20 px-2 sm:px-0"
                    >
                        <button
                            type="button"
                            onClick={() => setIsRegionModalOpen(true)}
                            className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-white border border-gray-300 hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all w-full sm:w-[140px] md:w-[200px] shadow-lg rounded-full"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                                <span className="text-sm sm:text-base text-gray-700 truncate">{selectedRegion}</span>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className="flex-1 w-full shadow-lg rounded-full">
                            <SearchBox
                                placeholder="What are you looking for today?"
                                className="w-full"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Region Selector Modal */}
            <RegionSelectorModal
                isOpen={isRegionModalOpen}
                onClose={() => setIsRegionModalOpen(false)}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
            />
        </>
    )
}
