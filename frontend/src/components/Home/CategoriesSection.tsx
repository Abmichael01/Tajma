"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavbarHeight } from '@/hooks/useNavbarHeight'
import { 
  Smartphone, Car, Home, Briefcase, Shirt, Wrench, Gamepad2,
  Phone, Laptop, Gamepad, Headphones, Camera, Monitor,
  Truck, Bike, Ship, Settings, Wrench as WrenchIcon, Car as CarIcon,
  Building, Building2, TreePine, Store, Key, Home as HomeIcon,
  Clock, Users, Globe, User, GraduationCap, FileText,
  Shirt as ShirtIcon, Footprints, Gem, Watch, ShoppingBag, Crown,
  Hammer, Scissors, Heart, Book, Truck as TruckIcon,
  Dumbbell, Mountain, Trophy, Target, Zap
} from 'lucide-react'

interface Subcategory {
  name: string
  icon: React.ReactNode
  count: number
}

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  subcategories: Subcategory[]
}

const categories: Category[] = [
  {
    id: "electronics",
    name: "Electronics",
    icon: <Smartphone className="w-5 h-5" />,
    count: 1247,
    subcategories: [
      { name: "Phones", icon: <Phone className="w-4 h-4" />, count: 342 },
      { name: "Laptops", icon: <Laptop className="w-4 h-4" />, count: 189 },
      { name: "Gaming", icon: <Gamepad className="w-4 h-4" />, count: 156 },
      { name: "Audio", icon: <Headphones className="w-4 h-4" />, count: 98 },
      { name: "Cameras", icon: <Camera className="w-4 h-4" />, count: 67 },
      { name: "Accessories", icon: <Monitor className="w-4 h-4" />, count: 395 }
    ]
  },
  {
    id: "vehicles",
    name: "Vehicles",
    icon: <Car className="w-5 h-5" />,
    count: 892,
    subcategories: [
      { name: "Cars", icon: <CarIcon className="w-4 h-4" />, count: 456 },
      { name: "Motorcycles", icon: <Bike className="w-4 h-4" />, count: 123 },
      { name: "Trucks", icon: <Truck className="w-4 h-4" />, count: 89 },
      { name: "Boats", icon: <Ship className="w-4 h-4" />, count: 34 },
      { name: "Auto Parts", icon: <Settings className="w-4 h-4" />, count: 156 },
      { name: "Tires", icon: <WrenchIcon className="w-4 h-4" />, count: 34 }
    ]
  },
  {
    id: "real-estate",
    name: "Real Estate",
    icon: <Home className="w-5 h-5" />,
    count: 634,
    subcategories: [
      { name: "Apartments", icon: <Building className="w-4 h-4" />, count: 234 },
      { name: "Houses", icon: <HomeIcon className="w-4 h-4" />, count: 189 },
      { name: "Land", icon: <TreePine className="w-4 h-4" />, count: 67 },
      { name: "Commercial", icon: <Building2 className="w-4 h-4" />, count: 89 },
      { name: "Rentals", icon: <Key className="w-4 h-4" />, count: 156 },
      { name: "For Sale", icon: <Store className="w-4 h-4" />, count: 145 }
    ]
  },
  {
    id: "jobs",
    name: "Jobs",
    icon: <Briefcase className="w-5 h-5" />,
    count: 445,
    subcategories: [
      { name: "Full-time", icon: <Clock className="w-4 h-4" />, count: 234 },
      { name: "Part-time", icon: <Users className="w-4 h-4" />, count: 89 },
      { name: "Remote", icon: <Globe className="w-4 h-4" />, count: 67 },
      { name: "Freelance", icon: <User className="w-4 h-4" />, count: 45 },
      { name: "Internships", icon: <GraduationCap className="w-4 h-4" />, count: 23 },
      { name: "Contract", icon: <FileText className="w-4 h-4" />, count: 67 }
    ]
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: <Shirt className="w-5 h-5" />,
    count: 723,
    subcategories: [
      { name: "Men's Clothing", icon: <ShirtIcon className="w-4 h-4" />, count: 234 },
      { name: "Women's Clothing", icon: <Shirt className="w-4 h-4" />, count: 289 },
      { name: "Shoes", icon: <Footprints className="w-4 h-4" />, count: 123 },
      { name: "Accessories", icon: <ShoppingBag className="w-4 h-4" />, count: 67 },
      { name: "Jewelry", icon: <Gem className="w-4 h-4" />, count: 45 },
      { name: "Watches", icon: <Watch className="w-4 h-4" />, count: 65 }
    ]
  },
  {
    id: "services",
    name: "Services",
    icon: <Wrench className="w-5 h-5" />,
    count: 356,
    subcategories: [
      { name: "Home Services", icon: <Hammer className="w-4 h-4" />, count: 123 },
      { name: "Professional", icon: <Briefcase className="w-4 h-4" />, count: 89 },
      { name: "Beauty", icon: <Heart className="w-4 h-4" />, count: 67 },
      { name: "Health", icon: <Heart className="w-4 h-4" />, count: 34 },
      { name: "Education", icon: <Book className="w-4 h-4" />, count: 23 },
      { name: "Transport", icon: <TruckIcon className="w-4 h-4" />, count: 20 }
    ]
  },
  {
    id: "sports",
    name: "Sports",
    icon: <Gamepad2 className="w-5 h-5" />,
    count: 278,
    subcategories: [
      { name: "Fitness", icon: <Dumbbell className="w-4 h-4" />, count: 89 },
      { name: "Outdoor", icon: <Mountain className="w-4 h-4" />, count: 67 },
      { name: "Team Sports", icon: <Trophy className="w-4 h-4" />, count: 45 },
      { name: "Equipment", icon: <Target className="w-4 h-4" />, count: 56 },
      { name: "Clothing", icon: <Shirt className="w-4 h-4" />, count: 34 },
      { name: "Accessories", icon: <Zap className="w-4 h-4" />, count: 87 }
    ]
  }
]

export default function CategoriesSection() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const navbarHeight = useNavbarHeight()

  return (
    <div 
      className="hidden lg:block lg:w-[230px] bg-white border border-gray-200 p-4 sticky h-fit relative z-10"
      style={{ top: `${navbarHeight + 16}px` }}
    >
      <h3 className="font-semibold text-gray-900 mb-4">Browse Categories</h3>

      <div className="space-y-1">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer group w-full">
              <div className="text-secondary group-hover:text-secondary/80 transition-colors">
                {category.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors flex-1">
                {category.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                {category.count}
              </span>
            </div>

            {/* Subcategories Dropdown with Framer Motion */}
            <AnimatePresence>
              {hoveredCategory === category.id && (
                <motion.div
                  className="absolute left-full top-0 w-48 bg-white border border-gray-200 shadow-lg z-50 p-2"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut"
                  }}
                >
                  <div className="space-y-1">
                    {category.subcategories.map((subcategory, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.1,
                          delay: index * 0.02,
                          ease: "easeOut"
                        }}
                      >
                        <div className="text-secondary">
                          {subcategory.icon}
                        </div>
                        <span className="flex-1">{subcategory.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5">
                          {subcategory.count}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
