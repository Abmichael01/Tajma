"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Store } from 'lucide-react'

export default function PromoStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-6 sm:mt-8">
      {/* Seller Promo Card - Premium Minimalist */}
      <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex items-center justify-between group hover:border-gray-300 hover:shadow-lg transition-all duration-500 ease-out">
        <div className="relative z-10 w-full sm:max-w-[70%] flex flex-col items-start text-left">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-800" />
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Are you a seller?</span>
          </div>
          <h3 className="text-[13px] sm:text-2xl font-black text-gray-900 mb-1 sm:mb-2 leading-tight tracking-tight">Post <span className="text-primary">ads</span> for free</h3>
          <p className="hidden sm:block text-sm font-medium text-gray-500 mb-6 sm:mb-8 leading-relaxed">Reach thousands of interested buyers instantly.</p>
          
          <Link href="/create-ad" className="mt-2 sm:mt-0 w-full sm:w-auto inline-flex items-center justify-center bg-gray-900 text-white font-bold py-2 sm:py-3 px-4 sm:px-7 rounded-full hover:bg-black transition-all shadow-sm sm:shadow-md group/btn whitespace-nowrap text-xs sm:text-base">
            <span>Sell</span><span className="hidden sm:inline">&nbsp;Now</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
        
        {/* Giant Watermark Background Icon */}
        <div className="absolute -right-6 sm:-right-8 -bottom-8 sm:-bottom-12 opacity-[0.03] group-hover:opacity-[0.05] group-hover:-translate-y-2 transition-all duration-700 ease-out pointer-events-none transform -rotate-6">
          <Store className="w-28 h-28 sm:w-56 sm:h-56 text-primary" />
        </div>
      </div>

      {/* Buyer Promo Card - Premium Minimalist */}
      <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex items-center justify-between group hover:border-gray-300 hover:shadow-lg transition-all duration-500 ease-out">
        <div className="relative z-10 w-full sm:max-w-[70%] flex flex-col items-start text-left">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/5 backdrop-blur-sm border border-primary/10">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Looking to buy?</span>
          </div>
          <h3 className="text-[13px] sm:text-2xl font-black text-gray-900 mb-1 sm:mb-2 leading-tight tracking-tight">Discover <span className="text-primary">deals</span></h3>
          <p className="hidden sm:block text-sm font-medium text-gray-500 mb-6 sm:mb-8 leading-relaxed">Find exactly what you need right near you.</p>
          
          <Link href="/search" className="mt-2 sm:mt-0 w-full sm:w-auto inline-flex items-center justify-center bg-gray-100 text-gray-900 border border-gray-200 font-bold py-2 sm:py-3 px-4 sm:px-7 rounded-full hover:bg-gray-200 hover:border-gray-300 transition-all shadow-sm group/btn whitespace-nowrap text-xs sm:text-base">
            <span>Buy</span><span className="hidden sm:inline">&nbsp;Items</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
        
        {/* Giant Watermark Background Icon */}
        <div className="absolute -right-6 sm:-right-8 -bottom-6 sm:-bottom-10 opacity-[0.03] group-hover:opacity-[0.05] group-hover:-translate-y-2 transition-all duration-700 ease-out pointer-events-none transform rotate-3">
          <ShoppingBag className="w-28 h-28 sm:w-56 sm:h-56 text-primary" />
        </div>
      </div>
    </div>
  )
}
