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
      <div className="max-w-lg mx-auto text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Something Went Wrong
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Don't worry, our team has been notified and we're working on it.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left overflow-auto">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            size="sm" 
            onClick={reset}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-white border border-gray-200 rounded">
          <p className="text-xs text-gray-600 mb-3">
            If this problem persists, please let us know
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/contact" className="text-xs text-primary hover:text-primary/80 font-medium">
              Contact Support
            </Link>
            <span className="hidden sm:inline text-gray-300">•</span>
            <Link href="/help" className="text-xs text-primary hover:text-primary/80 font-medium">
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

