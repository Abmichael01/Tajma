"use client"

import { useEffect } from 'react'

/**
 * Global error handler to suppress HMR-related WebSocket errors
 * These errors occur when Next.js HMR tries to parse chat WebSocket messages
 */
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Suppress HMR-related WebSocket errors
      if (
        errorMessage?.includes('unrecognized HMR message') ||
        errorMessage?.includes('HMR') ||
        (errorMessage?.includes('ping') && errorMessage?.includes('event')) ||
        (errorMessage?.includes('ping') && errorMessage?.includes('HMR'))
      ) {
        // Suppress these errors - they're harmless HMR conflicts
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      
      // Log other unhandled rejections for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unhandled promise rejection:', error)
      }
    }

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error instanceof Error ? event.error.message : String(event.error || event.message)
      
      // Suppress HMR-related errors
      if (
        errorMessage?.includes('unrecognized HMR message') ||
        errorMessage?.includes('HMR') ||
        (errorMessage?.includes('ping') && errorMessage?.includes('event')) ||
        (errorMessage?.includes('ping') && errorMessage?.includes('HMR'))
      ) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Also catch console errors
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorStr = args.join(' ')
      if (
        errorStr.includes('unrecognized HMR message') ||
        errorStr.includes('HMR') && errorStr.includes('ping') ||
        errorStr.includes('Failed to mark messages as delivered') ||
        (errorStr.includes('WebSocket error') && errorStr.includes('mark'))
      ) {
        // Suppress HMR errors and non-critical WebSocket errors
        // These are informational errors that don't break functionality
        return
      }
      originalConsoleError.apply(console, args)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
    window.addEventListener('error', handleError, true)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
      window.removeEventListener('error', handleError, true)
      console.error = originalConsoleError
    }
  }, [])

  return <>{children}</>
}

