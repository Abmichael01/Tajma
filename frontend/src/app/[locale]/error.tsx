'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry or other reporting services
    console.error('Tajma Runtime Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Simple Error visual */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/5 rounded-full blur-2xl transform scale-150" />
            <div className="relative w-24 h-24 bg-white border border-gray-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 border-4 border-white rounded-full flex items-center justify-center">
               <span className="text-white text-xs font-medium">!</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
             Unexpected Error
          </h1>
          <p className="text-sm font-medium text-gray-500 leading-relaxed mx-auto max-w-[300px]">
            We've encountered a snag while processing your request. Our team has been notified.
          </p>
        </div>

        {/* Action Buttons - Small & Clean */}
        <div className="flex flex-col gap-3 justify-center items-center">
          <button 
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#0F172B] text-white rounded-full text-sm font-medium transition-all hover:bg-[#1A253E] active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <Link 
              href="/" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            
            <Link 
              href="mailto:support@tajma.net" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
            >
              <Mail className="w-4 h-4 mr-2" />
              Support
            </Link>
          </div>
        </div>

        {/* Debug Info (Dev Mode) - Keep it very discreet */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-left overflow-hidden">
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2 px-1">Developer Details</p>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 text-[10px] font-mono whitespace-pre-wrap text-red-600/70 max-h-32 overflow-y-auto">
              {error.name}: {error.message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
