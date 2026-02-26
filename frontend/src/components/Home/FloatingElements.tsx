"use client"

import React from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { Smartphone, Shirt, Home, Car, Zap, ShoppingBag } from 'lucide-react'

interface FloatingElementsProps {
    mouseX: MotionValue<number>
    mouseY: MotionValue<number>
}

// Helper to randomize float animation
const floatingVariant = (delay: number) => ({
    animate: {
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
        transition: {
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut",
            delay: delay,
        }
    }
})

export default function FloatingElements({ mouseX, mouseY }: FloatingElementsProps) {
    // Determine movement strength based on mouse position (Parallax effect)
    // We invert the direction to create depth (mouse moves right, element moves left)

    // Front layer - moves faster
    const x1 = useTransform(mouseX, [0, 1], [30, -30])
    const y1 = useTransform(mouseY, [0, 1], [30, -30])

    // Middle layer - moves moderate
    const x2 = useTransform(mouseX, [0, 1], [15, -15])
    const y2 = useTransform(mouseY, [0, 1], [15, -15])

    // Back layer - moves slower
    const x3 = useTransform(mouseX, [0, 1], [5, -5])
    const y3 = useTransform(mouseY, [0, 1], [5, -5])

    const icons = [
        { Icon: Smartphone, color: "text-blue-500", bg: "bg-blue-100", size: "w-12 h-12", x: "10%", y: "20%", layer: 1, delay: 0 },
        { Icon: Shirt, color: "text-pink-500", bg: "bg-pink-100", size: "w-16 h-16", x: "85%", y: "15%", layer: 2, delay: 1 },
        { Icon: Home, color: "text-green-500", bg: "bg-green-100", size: "w-14 h-14", x: "75%", y: "60%", layer: 1, delay: 0.5 },
        { Icon: Car, color: "text-orange-500", bg: "bg-orange-100", size: "w-10 h-10", x: "15%", y: "70%", layer: 3, delay: 2 },
        { Icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100", size: "w-8 h-8", x: "50%", y: "10%", layer: 3, delay: 1.5 },
        { Icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-100", size: "w-20 h-20", x: "5%", y: "45%", layer: 2, delay: 0.2 },
    ]

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {icons.map((item, index) => {
                let xMotion, yMotion
                if (item.layer === 1) { xMotion = x1; yMotion = y1 }
                else if (item.layer === 2) { xMotion = x2; yMotion = y2 }
                else { xMotion = x3; yMotion = y3 }

                return (
                    <motion.div
                        key={index}
                        className={`absolute flex items-center justify-center rounded-2xl shadow-lg backdrop-blur-sm ${item.bg} ${item.color} ${item.size} border border-white/50`}
                        style={{
                            left: item.x,
                            top: item.y,
                            x: xMotion,
                            y: yMotion,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 0.6,
                            scale: 1,
                            y: [0, -20, 0],
                            rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                            duration: 0.8,
                            delay: index * 0.1,
                            y: {
                                duration: 5,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                                delay: item.delay,
                            },
                            rotate: {
                                duration: 5,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                                delay: item.delay,
                            }
                        }}
                    >
                        <item.Icon className="w-1/2 h-1/2" />
                    </motion.div>
                )
            })}
        </div>
    )
}
