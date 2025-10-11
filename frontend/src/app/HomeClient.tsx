"use client"

import React from 'react'
import Hero from '@/components/Home/Hero'
import AdsList from '@/components/Home/AdsList'
import CategoriesSection from '@/components/Home/CategoriesSection'
import { mockAds } from '@/data/mockAds'

export default function HomeClient() {
  return (
    <div className="bg-white min-h-screen">
      <Hero />
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Categories Section */}
          <CategoriesSection />
          
          {/* Ads List */}
          <div className="flex-1">
            <AdsList ads={mockAds} columns={4} className="py-4 sm:py-6 lg:py-8" />
          </div>
        </div>
      </div>
    </div>
  )
}