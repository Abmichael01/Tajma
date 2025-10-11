"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

export default function ProfileClient() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to the user's profile using their uid
      router.replace(`/profile/${user.uid}`)
    } else {
      // Redirect to login or homepage if not authenticated
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="container py-8">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <span className="ml-2 text-gray-600">Redirecting...</span>
      </div>
    </div>
  )
}