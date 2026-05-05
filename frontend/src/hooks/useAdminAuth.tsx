"use client"

import React, { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useCurrentUser } from './useAuth'

/**
 * Hook to check if user is admin (is_staff or is_superuser)
 */
export function useAdminAuth() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const { data: refreshedUser, isLoading: isLoadingUser } = useCurrentUser()
  
  // Use refreshed user data if available, otherwise use store data
  const currentUser = refreshedUser || user
  
  const isAdmin = Boolean(
    currentUser && 
    (currentUser.is_staff === true || currentUser.is_superuser === true)
  )
  
  // Debug logging
  if (currentUser && isAuthenticated) {
    console.log('Admin check:', {
      email: currentUser.email,
      is_staff: currentUser.is_staff,
      is_superuser: currentUser.is_superuser,
      isAdmin,
    })
  }
  
  return {
    isAdmin,
    isAuthenticated,
    user: currentUser,
    isLoadingUser,
    hasHydrated,
  }
}

/**
 * Component to protect admin routes
 * Redirects to home if user is not admin
 */
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAdmin, isAuthenticated, user, isLoadingUser, hasHydrated } = useAdminAuth()
  
  useEffect(() => {
    // Don't redirect until store has hydrated from localStorage
    if (!hasHydrated) {
      return
    }
    
    // Don't redirect while loading user data
    if (isLoadingUser) {
      return
    }
    
    // Only redirect if we're sure the user is not authenticated (after hydration)
    if (hasHydrated && !isAuthenticated && !user) {
      router.push('/login?redirect=/admin')
      return
    }
    
    // Only redirect if we're sure the user is authenticated but not admin
    if (isAuthenticated && user && !isAdmin) {
      console.log('User is not admin:', { 
        is_staff: user.is_staff, 
        is_superuser: user.is_superuser,
        user 
      })
      router.push('/')
      return
    }
  }, [isAdmin, isAuthenticated, user, router, isLoadingUser, hasHydrated])
  
  // Show loading while hydrating, checking auth, or if user data is not loaded yet
  if (!hasHydrated || isLoadingUser || (!isAuthenticated && !user) || (isAuthenticated && user && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MarketplaceLoader size="md" message="Checking permissions..." />
      </div>
    )
  }
  
  return <React.Fragment>{children}</React.Fragment>
}

