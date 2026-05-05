"use client"

import React, { useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
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
  const { isAuthenticated, isLoading, user, hasHydrated } = useAuthStore()

  useEffect(() => {
    // Only redirect if store has hydrated and user is confirmed not authenticated
    // and we're not currently loading user data from backend
    if (hasHydrated && !isLoading && !isAuthenticated && !user) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, hasHydrated, user, router, redirectTo])

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
  if (isLoading || !hasHydrated) {
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

