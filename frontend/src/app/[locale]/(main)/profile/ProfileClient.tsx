"use client"

import React, { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function ProfileClient() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const slug = user.username || user.email?.split('@')[0]
      if (slug) {
        router.replace(`/profile/${slug}`)
        return
      }
    } else {
      // Redirect to login or homepage if not authenticated
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="container py-8">
      <div className="flex items-center justify-center py-12">
        <MarketplaceLoader size="md" message="Redirecting..." />
      </div>
    </div>
  )
}