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

  // Extract file information from stack trace
  const getErrorSource = () => {
    if (!error.stack) return null
    
    const stackLines = error.stack.split('\n')
    // Look for the first stack frame that contains a file path
    for (const line of stackLines) {
      // Match patterns like: at ComponentName (file:///path/to/file.tsx:123:45)
      // or: at /path/to/file.tsx:123:45
      const match = line.match(/\(?([^:]+\.(tsx?|jsx?)):(\d+):(\d+)\)?/)
      if (match) {
        const filePath = match[1]
        const lineNumber = match[3]
        const columnNumber = match[4]
        // Extract just the filename from the full path
        const fileName = filePath.split('/').pop() || filePath
        return {
          file: fileName,
          fullPath: filePath,
          line: lineNumber,
          column: columnNumber,
        }
      }
    }
    return null
  }

  const errorSource = getErrorSource()

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
          <div className="mb-6 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded text-left overflow-auto">
              <p className="text-xs font-semibold text-red-900 mb-1">Error Message:</p>
              <p className="text-xs font-mono text-red-800 break-all">
                {error.message}
              </p>
            </div>
            
            {errorSource && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-left overflow-auto">
                <p className="text-xs font-semibold text-blue-900 mb-1">Error Source:</p>
                <p className="text-xs font-mono text-blue-800">
                  <span className="font-semibold">File:</span> {errorSource.file}
                </p>
                <p className="text-xs font-mono text-blue-800">
                  <span className="font-semibold">Line:</span> {errorSource.line}
                  {errorSource.column && `, Column: ${errorSource.column}`}
                </p>
                <p className="text-xs font-mono text-blue-700 mt-1 break-all opacity-75">
                  {errorSource.fullPath}
                </p>
              </div>
            )}

            {error.stack && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-left overflow-auto max-h-48">
                <p className="text-xs font-semibold text-gray-900 mb-1">Stack Trace:</p>
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              </div>
            )}
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

