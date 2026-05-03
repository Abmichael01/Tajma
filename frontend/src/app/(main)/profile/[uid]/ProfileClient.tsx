"use client"

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import ProfileLayout from '@/components/profile/ProfileLayout'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/ui/BackButton'
import { UserX } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { notificationsApi } from '@/api/notifications'
import CallSellerModal from '@/components/modals/CallSellerModal'
import type { User } from '@/api/types'
import { getUserFullName } from '@/utils/user'

interface ProfileClientProps {
  uid: string
}

const getProfileSlug = (profile: User) => {
  return String(profile.username || profile.id)
}

export default function ProfileClient({ uid }: ProfileClientProps) {
  const { user, isAuthenticated } = useAuthStore()
  const ownerSlug = useMemo(
    () => (user ? String(user.username || user.id) : null),
    [user]
  )
  const isOwner = !!(isAuthenticated && ownerSlug && ownerSlug === uid)
  const hasNotifiedRef = useRef(false)

  const {
    data: profileData,
    isLoading,
    error,
  } = useUserProfile(uid)

  const [currentProfile, setCurrentProfile] = useState<User | null>(null)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  useEffect(() => {
    if (profileData) {
      setCurrentProfile(profileData)
    }
  }, [profileData])

  // Send profile view notification
  useEffect(() => {
    if (profileData && isAuthenticated && !isOwner && !hasNotifiedRef.current && user) {
      console.log('🔔 Profile viewed - creating notification...')
      console.log('📤 Sending notification:', {
        recipient: profileData.id,
        viewer: user.id,
        profileOwner: profileData.id
      })
      
      hasNotifiedRef.current = true
      
      notificationsApi.create({
        recipient: profileData.id,
        type: 'ad_view',
        title: 'Profile Viewed',
        message: `${getUserFullName(user)} viewed your profile`,
        related_user: user.id,
      })
        .then((notification) => {
          console.log('✅ Profile view notification created successfully:', notification)
        })
        .catch((error: any) => {
          // Silently handle "already sent today" errors
          const errorMessage = error?.response?.data?.detail || error?.message || ''
          if (errorMessage.includes('already sent today')) {
            console.log('⏭️ Profile view notification already sent today, skipping')
          } else {
            console.error('❌ Failed to create profile view notification:', error)
            console.error('Error details:', {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            })
          }
        })
    }
  }, [profileData, isAuthenticated, isOwner, user])

  const handleContactClick = () => {
    if (!currentProfile) return
    // Navigate to chat page with user
    // For now, just show an alert - can be enhanced to create chat
    window.location.href = `/chat?user=${currentProfile.id}`
  }

  const handleCallSeller = async () => {
    if (!currentProfile || !currentProfile.phone) return
    
    // Send notification in background when button is clicked
    console.log('🔔 Call Seller button clicked - creating notification...')
    try {
      const viewerName = user ? getUserFullName(user) : 'Someone'
      console.log('📤 Sending notification:', {
        recipient: currentProfile.id,
        type: 'phone_view',
        viewer: viewerName,
      })
      
      const notification = await notificationsApi.create({
        recipient: currentProfile.id,
        type: 'phone_view',
        title: 'Phone Number Viewed',
        message: `${viewerName} viewed your phone number on your profile`,
        related_user: user?.id,
      })
      
      console.log('✅ Notification created successfully:', notification)
    } catch (error: any) {
      // Silently handle "already sent today" errors
      const errorMessage = error?.response?.data?.detail || error?.message || ''
      if (errorMessage.includes('already sent today')) {
        console.log('⏭️ Notification already sent today, skipping')
      } else {
        console.error('❌ Failed to notify seller:', error)
      }
      // Continue anyway - don't block user from seeing phone number
    }
    setIsCallModalOpen(true)
  }

  const handleLocalUpdate = (updates: Partial<User>) => {
    setCurrentProfile((prev) => (prev ? { ...prev, ...updates } : prev))
    
    // Also update global auth store if this is the owner's profile
    // This ensures navbar and other global components update instantly
    if (isOwner) {
      useAuthStore.getState().updateUser(updates)
    }
  }

  if (!currentProfile && isLoading) {
    return <ProfileSkeleton />
  }

  if (!currentProfile || error) {
    return (
      <div className="bg-gray-50/50 min-h-screen">
        <div className="container py-8">
          <div className="text-center py-12">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">
              The user profile you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="primary">
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <ProfileLayout
        user={currentProfile}
        profileSlug={getProfileSlug(currentProfile)}
        isOwner={isOwner}
        onContactClick={isOwner ? undefined : handleContactClick}
        onCallClick={isOwner ? undefined : handleCallSeller}
        onUpdateUser={isOwner ? handleLocalUpdate : undefined}
      />
      
      {/* Call Seller Modal */}
      {currentProfile?.phone && (
        <CallSellerModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          phoneNumber={currentProfile.phone}
          sellerName={getUserFullName(currentProfile)}
          sellerId={currentProfile.id}
          adId=""
          adTitle=""
        />
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="container py-8 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="h-48 bg-gray-100" />
            <div className="h-10 bg-gray-100" />
            <div className="h-10 bg-gray-100" />
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap gap-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-10 w-24 bg-gray-100" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-32 bg-gray-100" />
              ))}
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-20 bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
