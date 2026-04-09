"use client"

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getMediaUrl } from '@/lib/utils'


interface HeroBackgroundImagesProps {
    images: Array<{
        url: string
        alt: string
        position: {
            x: number
            y: number
            angle: number
            xPx: number
            yPx: number
        }
        rotation: number
        delay: number
    }>
}

export default function HeroBackgroundImages({ images }: HeroBackgroundImagesProps) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {images.map((image, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                        opacity: 1, 
                        scale: [1, 1.05, 1],
                        y: [0, -8, 0],
                        rotate: [image.rotation - 1.5, image.rotation + 1.5, image.rotation - 1.5],
                    }}
                    transition={{
                        opacity: { duration: 1, delay: image.delay },
                        scale: {
                            duration: 4 + index * 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: image.delay,
                        },
                        rotate: {
                            duration: 12 + index * 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: image.delay,
                        },
                        y: {
                            duration: 5 + index * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: image.delay,
                        },
                    }}
                    className="absolute"
                    style={{
                        left: `${image.position.x}%`,
                        top: `${image.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32">
                        <Image
                            src={getMediaUrl(image.url)}
                            alt={image.alt}

                            fill
                            className="object-cover rounded-2xl shadow-lg"
                            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 112px, 128px"
                        />
                    </div>
                </motion.div>
            ))}
            {/* Fade out gradient at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        </div>
    )
}
