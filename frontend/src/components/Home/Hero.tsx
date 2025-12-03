"use client"

import React, { useState } from 'react'
import SearchBox from '../ui/SearchBox'
import RegionSelectorModal from '../modals/RegionSelectorModal'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState('All Regions')

    return (
        <>
            <section className="relative bg-white py-12 sm:py-16 lg:py-20 overflow-hidden ">
                <div className="container relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Hero Text */}
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Find Everything You{' '}
                            <span className="text-secondary">Need</span>{' '}
                            Right Here
                        </motion.h1>

                        {/* Search Box with State Selector */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="max-w-lg sm:max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-2"
                        >
                            <button
                                type="button"
                                onClick={() => setIsRegionModalOpen(true)}
                                className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-white border border-gray-300 hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all w-full sm:w-[140px] md:w-[200px] shadow-sm rounded-full"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                                    <span className="text-sm sm:text-base text-gray-700 truncate">{selectedRegion}</span>
                                </div>
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="flex-1 w-full">
                                <SearchBox
                                    placeholder="What are you looking for today?"
                                    className="w-full"
                                />
                            </div>
                        </motion.div>
                    </div>
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
