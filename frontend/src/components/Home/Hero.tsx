"use client"

import React, { useState } from 'react'
import SearchBox from '../ui/SearchBox'
import StateSelectorModal from '../modals/StateSelectorModal'
import { Button } from '../ui/button'
import { MapPin } from 'lucide-react'

export default function Hero() {
    const [isStateModalOpen, setIsStateModalOpen] = useState(false)
    const [selectedState, setSelectedState] = useState('All States')

    return (
        <>
            <section className="bg-white py-8 sm:py-12 lg:py-16">
                <div className="container">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Hero Text */}
                        <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight font-dmSans">
                            Let's find the{' '}
                            <span className="text-secondary">right seller</span>{' '}
                            for what you want
                        </h1>

                        {/* Search Box with State Selector */}
                        <div className="max-w-lg sm:max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setIsStateModalOpen(true)}
                                className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-white border border-gray-300 hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all w-full sm:w-[140px] md:w-[200px]"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                                    <span className="text-sm sm:text-base text-gray-700 truncate">{selectedState}</span>
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
                        </div>
                    </div>
                </div>
            </section>

            {/* State Selector Modal */}
            <StateSelectorModal
                isOpen={isStateModalOpen}
                onClose={() => setIsStateModalOpen(false)}
                selectedState={selectedState}
                onSelectState={setSelectedState}
            />
        </>
    )
}
