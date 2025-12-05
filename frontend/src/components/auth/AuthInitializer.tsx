"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCurrentUser } from '@/hooks/useAuth'

/**
 * Component to initialize and verify authentication state on app load
 * This ensures auth state is properly synced with the backend
 */
export default function AuthInitializer() {
  const { hasHydrated } = useAuthStore()
  
  // Call useCurrentUser to verify auth state and sync with backend
  // This will fetch user data if authenticated or clear stale state
  useCurrentUser()
  
  // This component doesn't render anything, it just initializes auth
  return null
}
