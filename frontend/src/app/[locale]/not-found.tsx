'use client'

import React from 'react'
import { Link } from '@/i18n/routing'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Simple Error Character / Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl transform scale-150" />
            <div className="relative w-24 h-24 bg-white border border-gray-100 rounded-2xl flex items-center justify-center">
              <Search className="w-10 h-10 text-primary opacity-80" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary border-2 border-white rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-medium">404</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
            Page not found
          </h1>
          <p className="text-sm font-medium text-gray-500 leading-relaxed mx-auto max-w-[280px]">
            The page you're looking for doesn't exist or has been moved to a new home.
          </p>
        </div>

        {/* Action Buttons - Small & Clean */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link 
            href="/" 
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium transition-all hover:bg-primary/90 active:scale-95"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
          
          <Link 
            href="/search" 
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
          >
            <Search className="w-4 h-4 mr-2" />
            Keep Browsing
          </Link>
        </div>

        {/* Subtle Back Link */}
        <div className="pt-4">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
