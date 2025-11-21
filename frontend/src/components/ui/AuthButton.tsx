"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { UserCheck } from 'lucide-react'
import MarketplaceLoader from './MarketplaceLoader'

export default function AuthButton() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  const handleAuthenticate = () => {
    router.push('/login')
  }

      if (isLoading) {
        return (
          <Button variant="ghost" size="sm" disabled>
            <MarketplaceLoader inline size="sm" />
            <span className="ml-2">Authenticating...</span>
          </Button>
        )
      }

  if (isAuthenticated) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <UserCheck className="w-4 h-4 mr-2 text-green-600" />
        Authenticated
      </Button>
    )
  }

  return (
    <Button 
      variant="secondary" 
      size="sm"
      onClick={handleAuthenticate}
      className="hover:bg-secondary/90"
    >
      Sign In
    </Button>
  )
}
