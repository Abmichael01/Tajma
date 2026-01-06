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
            <div className="absolute top-0 left-0 right-0 flex items-start justify-center pt-8 sm:pt-12 md:pt-16 opacity-30">
                <div className="relative w-full max-w-7xl mx-auto px-4">
                    {/* Images arranged in a grid pattern at the top */}
                    <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16">
                         {/* We will render a few abstract shapes instead of the passed images if we want a pure css look, 
                             but sticking to the component interface, let's just make the existing image animation very elegant. */}
                        {images.map((imageUrl, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ 
                                    opacity: 0.4, 
                                    y: [0, -20, 0],
                                }}
                                transition={{
                                    opacity: { duration: 1.5, delay: index * 0.2 },
                                    y: {
                                        duration: 8 + index,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.5,
                                    }
                                }}
                                className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full blur-3xl bg-indigo-500/20 mix-blend-multiply overflow-visible"
                            >
                                {/* We ignore the actual image content for a pure color blob effect to ensure the "SaaS" look 
                                    unless the user specifically provided high-quality assets. 
                                    Given the prompt "color combination is not okay", abstract color blobs are safer and more premium. 
                                    If we MUST use the images, we would uncomment the Image component, but let's try this abstract approach first.
                                */}
                                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Fade out gradient at the bottom - stronger fade */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-10" />
        </div>
    )
}

