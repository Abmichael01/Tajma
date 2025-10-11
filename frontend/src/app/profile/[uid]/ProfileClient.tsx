"use client"

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import ProfileLayout from '@/components/profile/ProfileLayout'
import { Button } from '@/components/ui/button'
import { Loader2, UserX } from 'lucide-react'

interface ProfileClientProps {
  uid: string
}

export default function ProfileClient({ uid }: ProfileClientProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine if this is the authenticated user's own profile
  const isOwner = !!(isAuthenticated && user && user.uid === uid)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call to fetch user profile by uid
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock different users for demonstration
        const mockUsers = {
          'john_doe_123': {
            id: '1',
            uid: 'john_doe_123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: 'Lagos, Nigeria',
            phone: '+234 801 234 5678',
            bio: 'I\'m a passionate seller on Tajma Marketplace, offering quality products at great prices. With years of experience in electronics and gadgets, I ensure all my items are in excellent condition. Feel free to contact me for any questions!',
            isVerified: true,
            joinedDate: '2024-01-15'
          },
          'sarah_johnson': {
            id: '2',
            uid: 'sarah_johnson',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            location: 'Abuja, Nigeria',
            phone: '+234 802 345 6789',
            bio: 'Welcome to my profile! I specialize in fashion and lifestyle items. All my products are carefully selected and in perfect condition. I believe in providing excellent customer service and fast shipping.',
            isVerified: true,
            joinedDate: '2024-01-10'
          },
          'michael_chen': {
            id: '3',
            uid: 'michael_chen',
            name: 'Michael Chen',
            email: 'michael.chen@example.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            location: 'Port Harcourt, Nigeria',
            phone: '+234 803 456 7890',
            bio: 'New to Tajma Marketplace but excited to connect with buyers! I focus on home and garden items, sports equipment, and collectibles. Always open to negotiations.',
            isVerified: false,
            joinedDate: '2024-01-05'
          }
        }

        const foundUser = mockUsers[uid as keyof typeof mockUsers]
        
        if (foundUser) {
          setProfileUser(foundUser)
        } else {
          setError('User not found')
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [uid])

  const handleContactClick = () => {
    // In real app, this would open a contact/message modal
    console.log('Contact user:', profileUser?.name)
    alert(`Contacting ${profileUser?.name}...`)
  }

  const handleUpdateUser = (updates: any) => {
    // In real app, this would update the user profile via API
    console.log('Updating user:', updates)
    if (profileUser) {
      setProfileUser({ ...profileUser, ...updates })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="bg-white min-h-screen">
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
    <div className="bg-white min-h-screen">
      <ProfileLayout 
        user={profileUser}
        isOwner={isOwner}
        onContactClick={handleContactClick}
        onUpdateUser={isOwner ? handleUpdateUser : undefined}
      />
    </div>
  )
}
