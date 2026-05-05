"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const banners = [
  { 
    id: 1, 
    image: "/hero-images/electronics.png", 
    mobileImage: "/hero-images/electronics-mobile.png",
    href: "/category/electronics" 
  },
  { 
    id: 2, 
    image: "/hero-images/vehicles.png", 
    mobileImage: "/hero-images/vehicles-mobile.png",
    href: "/category/vehicles" 
  },
  { 
    id: 3, 
    image: "/hero-images/fashion.png", 
    mobileImage: "/hero-images/fashion-mobile.png",
    href: "/category/fashion" 
  },
  { 
    id: 4, 
    image: "/hero-images/real-estate.png", 
    mobileImage: "/hero-images/real-estate-mobile.png",
    href: "/category/real-estate" 
  },
  { 
    id: 5, 
    image: "/hero-images/furniture.png", 
    mobileImage: "/hero-images/furniture-mobile.png",
    href: "/category/home-furniture-garden" 
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentSlide(
      (prev) => (prev + newDirection + banners.length) % banners.length,
    );
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { duration: 0.8, ease: [0.32, 0.72, 0, 1] as const },
        opacity: { duration: 0.4 },
        scale: { duration: 0.8 },
      },
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden group shadow-sm border border-gray-200 bg-gray-50">
      <div className="grid grid-cols-1 grid-rows-1">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { duration: 0.85, ease: [0.32, 0.72, 0, 1] as const },
              opacity: { duration: 0.5 },
              scale: { duration: 0.85, ease: [0.32, 0.72, 0, 1] as const },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="col-start-1 row-start-1 w-full cursor-grab active:cursor-grabbing"
          >
            <Link href={banners[currentSlide].href} className="block w-full overflow-hidden">
              <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full"
              >
                {/* Desktop Image */}
                <div className={banners[currentSlide].mobileImage ? "hidden sm:block" : "block"}>
                  <Image
                    src={banners[currentSlide].image}
                    alt={`Banner ${currentSlide + 1}`}
                    width={1600}
                    height={600}
                    className="w-full h-auto block"
                    priority
                  />
                </div>
                
                {/* Mobile Image */}
                {banners[currentSlide].mobileImage && (
                  <div className="sm:hidden">
                    <Image
                      src={banners[currentSlide].mobileImage}
                      alt={`Banner ${currentSlide + 1} Mobile`}
                      width={800}
                      height={1000}
                      className="w-full h-auto block"
                      priority
                    />
                  </div>
                )}
              </motion.div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => paginate(-1)}
          className="p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? "bg-white w-10 shadow-lg"
                : "bg-white/30 w-1.5 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
