"use client"

import React from 'react'
import Link from 'next/link'
import { 
  Smartphone, 
  Car, 
  Home, 
  Briefcase, 
  Wrench, 
  ShoppingBag, 
  Sofa, 
  Dumbbell 
} from 'lucide-react'

interface Category {
  name: string
  slug: string
  icon: React.ReactNode
}

const categories: Category[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: <Smartphone className="w-6 h-6" />
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    icon: <Car className="w-6 h-6" />
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    icon: <Home className="w-6 h-6" />
  },
  {
    name: 'Jobs',
    slug: 'jobs',
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    name: 'Services',
    slug: 'services',
    icon: <Wrench className="w-6 h-6" />
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: <ShoppingBag className="w-6 h-6" />
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    icon: <Sofa className="w-6 h-6" />
  },
  {
    name: 'Sports',
    slug: 'sports',
    icon: <Dumbbell className="w-6 h-6" />
  }
]

export default function CategoryGrid() {
  return (
    <section className="py-6 sm:py-8 lg:hidden">
      <div className="container">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Browse Categories</h2>
        
        <div className="grid grid-cols-3 min-[400px]:grid-cols-4 gap-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 hover:border-secondary/50 hover:shadow-md transition-all text-secondary"
            >
              <div className="mb-2">
                {category.icon}
              </div>
              <span className="text-sm font-semibold text-center text-gray-900">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

