"use client"

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import ChatSkeleton from '@/components/ui/ChatSkeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  loadingComponent
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)

  // Wait for persisted state to load (Zustand persist needs a moment to hydrate)
  useEffect(() => {
    // Give Zustand persist a moment to restore state from localStorage
    const timer = setTimeout(() => {
      setIsCheckingAuth(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only redirect if we've finished checking auth and user is not authenticated
    // Also check if user exists, as persisted state might have user but isAuthenticated might be delayed
    if (!isCheckingAuth && !isLoading && !isAuthenticated && !user) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, isCheckingAuth, user, router, redirectTo])

  // Determine which loading component to use
  const getLoadingComponent = () => {
    if (loadingComponent) {
      return loadingComponent
    }
    
    // Use ChatSkeleton for chat page
    if (pathname === '/chat') {
      return <ChatSkeleton />
    }
    
    // Default to MarketplaceLoader for other pages
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <MarketplaceLoader size="lg" message="Authenticating your account...." />
      </div>
    )
  }

  // Show loading while checking auth or waiting for persisted state to load
  if (isLoading || isCheckingAuth) {
    return getLoadingComponent()
  }

  // Check if user is authenticated (either by isAuthenticated flag or by user object existing)
  const isUserAuthenticated = isAuthenticated || Boolean(user)

  // Don't render children if not authenticated (will redirect)
  // But don't show "Redirecting to login..." - just show the loading component
  if (!isUserAuthenticated) {
    return getLoadingComponent()
  }

  // Render children if authenticated
  return <>{children}</>
}

