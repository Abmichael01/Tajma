"use client"

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface HeroBackgroundContainerProps {
    images: string[]
}

export default function HeroBackgroundContainer({ images }: HeroBackgroundContainerProps) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Background images container - positioned at the top of hero */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-center pt-8 sm:pt-12 md:pt-16">
                <div className="relative w-full max-w-7xl mx-auto px-4">
                    {/* Images arranged in a grid pattern at the top */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                        {images.map((imageUrl, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                    opacity: 0.3, 
                                    scale: [1, 1.05, 1],
                                    rotate: [index % 2 === 0 ? -2 : 2, index % 2 === 0 ? 2 : -2, index % 2 === 0 ? -2 : 2],
                                }}
                                transition={{
                                    opacity: { duration: 1, delay: index * 0.15 },
                                    scale: {
                                        duration: 4 + index * 0.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.15,
                                    },
                                    rotate: {
                                        duration: 12 + index * 0.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.15,
                                    },
                                }}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl overflow-hidden"
                            >
                                <Image
                                    src={imageUrl}
                                    alt={`Background ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 112px, 128px"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Fade out gradient at the bottom - stronger fade */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-10" />
        </div>
    )
}

