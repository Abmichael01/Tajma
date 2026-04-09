"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", 
    title: "Discover Amazing Deals",
    subtitle: "Shop electronics, fashion, cars, and more from trusted sellers.",
    cta: "Start Shopping",
    href: "/search",
    tag: "Premium Selection",
    gradientClass: "bg-gradient-to-r from-primary via-primary/95 sm:via-primary/80 to-transparent text-white"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop", 
    title: "Upgrade Your Tech",
    subtitle: "Find the best premium gadgets at unbeatable prices.",
    cta: "Explore Tech",
    href: "/category/electronics",
    tag: "Latest Gadgets",
    gradientClass: "bg-gradient-to-r from-secondary via-secondary/95 sm:via-secondary/80 to-transparent text-white"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop", 
    title: "Step into Style",
    subtitle: "Exclusive offers on the latest sneakers and fashion items.",
    cta: "Shop Fashion",
    href: "/category/fashion",
    tag: "Trending Styles",
    gradientClass: "bg-gradient-to-r from-gray-900 via-gray-900/95 sm:via-gray-900/80 to-transparent text-white"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop", 
    title: "Transform Your Home",
    subtitle: "Premium furniture and interior appliances delivered right to you.",
    cta: "Upgrade Home",
    href: "/category/home-furniture",
    tag: "Home Interior",
    gradientClass: "bg-gradient-to-r from-primary via-primary/95 sm:via-primary/80 to-transparent text-white"
  }
]

export default function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length)
        }, 6500)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative w-full h-[320px] sm:h-[400px] md:h-[420px] bg-gray-900 rounded-3xl overflow-hidden group shadow border border-gray-100">
            {banners.map((banner, index) => (
                <div 
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {/* The Image Overlay (Placed to the right seamlessly on larger screens) */}
                    <div className="absolute inset-0 w-full sm:w-[70%] sm:left-[30%]">
                      <Image
                          src={banner.image}
                          alt={banner.title}
                          fill
                          className="object-cover object-center"
                          unoptimized
                          priority={index === 0}
                      />
                    </div>
                    
                    {/* The Sweeping Content Gradient */}
                    <div className={`absolute inset-0 flex flex-col justify-center p-8 lg:p-12 z-10 ${banner.gradientClass}`}>
                        <div className={`max-w-xl transform transition-all duration-700 ease-out delay-100 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <span className="inline-block py-1.5 px-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-4 sm:mb-6 w-fit">
                                {banner.tag}
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 text-white leading-[1.1] tracking-tight max-w-sm sm:max-w-none">
                                {banner.title}
                            </h2>
                            <p className="text-sm sm:text-base mb-6 sm:mb-8 text-white/90 font-medium max-w-[90%] leading-relaxed drop-shadow-sm">
                                {banner.subtitle}
                            </p>
                            <Link 
                                href={banner.href}
                                className="inline-flex items-center justify-center bg-white text-gray-900 font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group/cta w-fit"
                            >
                                {banner.cta}
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover/cta:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Premium Slide Indicators */}
            <div className="absolute bottom-6 left-8 lg:left-12 flex gap-2 z-20">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2 rounded-full transition-all duration-500 ease-out shadow-sm ${
                          index === currentSlide 
                            ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                            : 'bg-white/40 w-2 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
