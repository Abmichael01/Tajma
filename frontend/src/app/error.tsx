"use client"

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-red-100 w-24 h-24 flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Something Went Wrong
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          We're sorry, but something unexpected happened. Don't worry, our team has been notified and we're working on it.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-left overflow-auto">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={reset}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 p-6 bg-white border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            If this problem persists, please let us know
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="text-sm text-primary hover:text-primary/80 font-medium">
              Contact Support
            </Link>
            <span className="hidden sm:inline text-gray-300">•</span>
            <Link href="/help" className="text-sm text-primary hover:text-primary/80 font-medium">
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

