"use client"

import React, { useState, useEffect } from 'react'
import RegionSelectorModal from '../modals/RegionSelectorModal'
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

// Mock banner data - 5 categories
const banners = [
    {
        id: 1,
        category: "ELECTRONICS",
        badge: "TRENDING NOW",
        title: "Upgrade Your Tech Game",
        description: "Discover the latest smartphones, laptops, and gadgets at unbeatable prices.",
        ctaText: "Browse Electronics",
        ctaLink: "/category/electronics",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        bgImage: "/electronics_banner.png"
    },
    {
        id: 2,
        category: "VEHICLES",
        badge: "FEATURED",
        title: "Find Your Dream Ride",
        description: "Explore premium cars, motorcycles, and more from trusted sellers.",
        ctaText: "View Vehicles",
        ctaLink: "/category/vehicles",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        bgImage: "/vehicles_banner.png"
    },
    {
        id: 3,
        category: "PROPERTY",
        badge: "HOT DEALS",
        title: "Your Perfect Home Awaits",
        description: "Browse apartments, houses, and commercial spaces in prime locations.",
        ctaText: "Explore Properties",
        ctaLink: "/category/property",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        bgImage: "/property_banner.png"
    },
    {
        id: 4,
        category: "FASHION",
        badge: "NEW ARRIVALS",
        title: "Style Meets Elegance",
        description: "Shop designer clothing, accessories, and footwear from top brands.",
        ctaText: "Shop Fashion",
        ctaLink: "/category/fashion",
        gradient: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
        bgImage: "/fashion_banner.png"
    },
    {
        id: 5,
        category: "SERVICES",
        badge: "PROFESSIONALS",
        title: "Expert Services Ready",
        description: "Connect with skilled professionals for all your business and personal needs.",
        ctaText: "Find Services",
        ctaLink: "/category/services",
        gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        bgImage: "/services_banner.png"
    }
]

// Mock ad data for each category
const adsData = [
    // Electronics
    [
        { id: 1, title: "iPhone 15 Pro Max", price: "850,000", currency: "FCFA", location: "Niamey", image: "", badge: "NEW" },
        { id: 2, title: "MacBook Air M2", price: "1,200,000", currency: "FCFA", location: "Dosso", image: "", badge: "FEATURED" },
        { id: 3, title: "Samsung Galaxy S24", price: "650,000", currency: "FCFA", location: "Maradi", image: "" },
        { id: 4, title: "iPad Pro 12.9", price: "980,000", currency: "FCFA", location: "Niamey", image: "", badge: "HOT" },
        { id: 5, title: "Sony Headphones", price: "85,000", currency: "FCFA", location: "Zinder", image: "" }
    ],
    // Vehicles
    [
        { id: 6, title: "Toyota Camry 2022", price: "12,500,000", currency: "FCFA", location: "Niamey", image: "", badge: "NEW" },
        { id: 7, title: "Honda Civic 2021", price: "9,800,000", currency: "FCFA", location: "Zinder", image: "" },
        { id: 8, title: "Mercedes C-Class", price: "18,000,000", currency: "FCFA", location: "Niamey", image: "", badge: "FEATURED" },
        { id: 9, title: "BMW X5 2023", price: "22,000,000", currency: "FCFA", location: "Dosso", image: "", badge: "HOT" },
        { id: 10, title: "Range Rover Sport", price: "35,000,000", currency: "FCFA", location: "Niamey", image: "" }
    ],
    // Property
    [
        { id: 11, title: "3BR Apartment", price: "45,000,000", currency: "FCFA", location: "Niamey Centre", image: "", badge: "HOT" },
        { id: 12, title: "Villa with Pool", price: "85,000,000", currency: "FCFA", location: "Plateau", image: "", badge: "NEW" },
        { id: 13, title: "Commercial Space", price: "120,000,000", currency: "FCFA", location: "Downtown", image: "" },
        { id: 14, title: "Luxury Penthouse", price: "150,000,000", currency: "FCFA", location: "Niamey", image: "", badge: "FEATURED" },
        { id: 15, title: "Studio Apartment", price: "25,000,000", currency: "FCFA", location: "Maradi", image: "" }
    ],
    // Fashion
    [
        { id: 16, title: "Gucci Handbag", price: "450,000", currency: "FCFA", location: "Niamey", image: "", badge: "NEW" },
        { id: 17, title: "Rolex Watch", price: "2,500,000", currency: "FCFA", location: "Dosso", image: "", badge: "FEATURED" },
        { id: 18, title: "Designer Sunglasses", price: "120,000", currency: "FCFA", location: "Maradi", image: "" },
        { id: 19, title: "Louis Vuitton Shoes", price: "350,000", currency: "FCFA", location: "Niamey", image: "", badge: "HOT" },
        { id: 20, title: "Prada Wallet", price: "180,000", currency: "FCFA", location: "Zinder", image: "" }
    ],
    // Services
    [
        { id: 21, title: "Web Development", price: "500,000", currency: "FCFA", location: "Niamey", image: "", badge: "NEW" },
        { id: 22, title: "Graphic Design", price: "150,000", currency: "FCFA", location: "Dosso", image: "", badge: "FEATURED" },
        { id: 23, title: "Marketing Consultant", price: "300,000", currency: "FCFA", location: "Maradi", image: "" },
        { id: 24, title: "Legal Services", price: "250,000", currency: "FCFA", location: "Niamey", image: "", badge: "HOT" },
        { id: 25, title: "Accounting Services", price: "200,000", currency: "FCFA", location: "Zinder", image: "" }
    ]
]

export default function Hero() {
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState('All Regions')
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
    const [currentAdIndex, setCurrentAdIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [bannerDirection, setBannerDirection] = useState(1) // 1 = next, -1 = previous
    const [adDirection, setAdDirection] = useState(1) // 1 = next, -1 = previous

    const currentBanner = banners[currentBannerIndex]
    const currentCategoryAds = adsData[currentBannerIndex]
    const currentAd = currentCategoryAds[currentAdIndex]

    // Auto-scroll both banner and ads together (pauses on hover)
    useEffect(() => {
        if (isHovered) return

        const interval = setInterval(() => {
            setBannerDirection(1)
            setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
        }, 5000) // 5 seconds

        return () => clearInterval(interval)
    }, [isHovered])

    // Reset ad index when banner changes
    useEffect(() => {
        setCurrentAdIndex(0)
    }, [currentBannerIndex])

    const handleBannerPrevious = () => {
        setBannerDirection(-1)
        setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
    }

    const handleBannerNext = () => {
        setBannerDirection(1)
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }

    const handleAdPrevious = () => {
        setAdDirection(-1)
        setCurrentAdIndex((prev) => (prev - 1 + currentCategoryAds.length) % currentCategoryAds.length)
    }

    const handleAdNext = () => {
        setAdDirection(1)
        setCurrentAdIndex((prev) => (prev + 1) % currentCategoryAds.length)
    }

    // Format price
    const formattedPrice = `${currentAd.currency} ${parseFloat(currentAd.price).toLocaleString()}`

    return (
        <>
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-gray-50 to-white pt-6 pb-12 sm:pt-8 sm:pb-16">
                <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                    {/* Split Layout Container */}
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Left Column - Banner */}
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Banner Navigation Buttons - At Top */}
                            <div className="flex items-center justify-start gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleBannerPrevious}
                                    className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50 hover:border-primary hover:shadow-md transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </motion.button>

                                <span className="text-sm text-gray-600 font-medium min-w-[120px] text-center">
                                    {currentBanner.category}
                                </span>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleBannerNext}
                                    className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50 hover:border-primary hover:shadow-md transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </motion.button>
                            </div>

                            {/* Banner Content */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentBanner.id}
                                    initial={{ opacity: 0, x: bannerDirection * 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: bannerDirection * -50 }}
                                    transition={{ duration: 0.5 }}
                                    className="h-[400px] rounded-xl relative overflow-hidden shadow-lg"
                                    style={{
                                        background: currentBanner.gradient
                                    }}
                                >
                                    {/* Background Image */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src={currentBanner.bgImage}
                                            alt={currentBanner.category}
                                            fill
                                            className="object-cover opacity-70"
                                        />
                                    </div>

                                    {/* Glassmorphism Overlay */}
                                    <div className="absolute inset-0 bg-black/10"></div>

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col justify-center p-8 md:p-12 text-white">
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase mb-4 w-fit"
                                        >
                                            {currentBanner.badge}
                                        </motion.span>

                                        <motion.h2
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight"
                                        >
                                            {currentBanner.title}
                                        </motion.h2>

                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-base sm:text-lg text-white/90 mb-6 max-w-xl"
                                        >
                                            {currentBanner.description}
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <Button
                                                size="lg"
                                                className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-6 shadow-xl hover:shadow-2xl transition-all group"
                                            >
                                                {currentBanner.ctaText}
                                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </motion.div>

                                        {/* Indicator Dots */}
                                        <div className="absolute bottom-6 left-8 flex gap-2">
                                            {banners.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setBannerDirection(index > currentBannerIndex ? 1 : -1)
                                                        setCurrentBannerIndex(index)
                                                    }}
                                                    className={`h-1.5 rounded-full transition-all ${index === currentBannerIndex
                                                        ? 'w-8 bg-white'
                                                        : 'w-1.5 bg-white/50 hover:bg-white/75'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Right Section - Ads Navigation */}
                        <div className="w-[300px] flex flex-col gap-4">
                            {/* Navigation Controls at Top */}
                            <div className="flex items-center justify-between gap-3">
                                {/* Ad Navigation Buttons */}
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAdPrevious}
                                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50 hover:border-primary hover:shadow-md transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAdNext}
                                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50 hover:border-primary hover:shadow-md transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </motion.button>
                                </div>

                                {/* See All Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 h-10 border-2 border-secondary text-secondary rounded-full px-4 font-semibold hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 group text-sm"
                                >
                                    View All
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>

                            {/* Single Ad Card - Different Animation Direction */}
                            <div
                                className="flex-1"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentAd.id}
                                        initial={{ opacity: 0, y: adDirection * 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: adDirection * -30 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                                    >
                                        {/* Image Section */}
                                        <div className="relative w-full h-48 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300">
                                            {currentAd.badge && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white rounded bg-secondary">
                                                    {currentAd.badge}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                                                    {currentAd.title}
                                                </h3>
                                                <div className="font-bold text-lg text-primary">
                                                    {formattedPrice}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 pt-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {currentAd.location}
                                                </div>
                                            </div>

                                            {/* Ad Counter */}
                                            <div className="pt-4 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 text-center">
                                                    {currentAdIndex + 1} / {currentCategoryAds.length}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

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
