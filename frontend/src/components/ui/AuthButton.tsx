"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore, simulateAuth } from '@/store/authStore'
import { Loader2, UserCheck } from 'lucide-react'

export default function AuthButton() {
  const { isAuthenticated, isLoading } = useAuthStore()

  const handleAuthenticate = () => {
    simulateAuth()
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Authenticating...
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
      Authenticate
    </Button>
  )
}
