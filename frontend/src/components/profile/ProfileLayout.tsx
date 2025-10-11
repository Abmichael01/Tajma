"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import ProfileOverview from './ProfileOverview'
import ProfileAds from './ProfileAds'
import ProfileReviews from './ProfileReviews'
import ProfileSettings from './ProfileSettings'
import ProfileSaved from './ProfileSaved'
import ProfileNotifications from './ProfileNotifications'

interface User {
  id: string
  uid: string
  name: string
  email: string
  avatar?: string
  location?: string
  phone?: string
  isVerified: boolean
  joinedDate: string
}

interface ProfileLayoutProps {
  user: User
  isOwner?: boolean
  onContactClick?: () => void
  onUpdateUser?: (updates: Partial<User>) => void
}

export default function ProfileLayout({ 
  user, 
  isOwner = false, 
  onContactClick,
  onUpdateUser 
}: ProfileLayoutProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  // Mock data - in real app, this would come from props or API
  const stats = {
    totalAds: 12,
    activeAds: 8,
    soldItems: 4,
    totalViews: 1247,
    totalFavorites: 23,
    responseRate: 95,
    rating: 4.8,
    joinedDays: 45
  }

  const ads = [
    {
      id: '1',
      title: 'iPhone 14 Pro Max 256GB - Space Black',
      price: '₦850,000',
      location: 'Victoria Island, Lagos',
      state: 'lagos',
      city: 'Victoria Island',
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
      views: 245,
      favorites: 12,
      messages: 8,
      status: 'active' as const,
      category: 'electronics',
      postedDate: '2 days ago'
    },
    {
      id: '2',
      title: 'MacBook Pro M2 13-inch',
      price: '₦1,200,000',
      location: 'Surulere, Lagos',
      state: 'lagos',
      city: 'Surulere',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      views: 189,
      favorites: 7,
      messages: 5,
      status: 'active' as const,
      category: 'electronics',
      postedDate: '5 days ago'
    },
    {
      id: '3',
      title: 'Samsung Galaxy S23 Ultra',
      price: '₦750,000',
      location: 'Gbagada, Lagos',
      state: 'lagos',
      city: 'Gbagada',
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
      views: 156,
      favorites: 9,
      messages: 3,
      status: 'sold' as const,
      category: 'electronics',
      postedDate: '1 week ago'
    },
    {
      id: '4',
      title: 'Sony PlayStation 5 - Brand New',
      price: '₦450,000',
      location: 'Alaba, Lagos',
      state: 'lagos',
      city: 'Alaba',
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
      views: 678,
      favorites: 23,
      messages: 15,
      status: 'active' as const,
      category: 'electronics',
      postedDate: '3 days ago'
    },
    {
      id: '5',
      title: 'Dell XPS 13 Laptop - 2023 Model',
      price: '₦780,000',
      location: 'Yaba, Lagos',
      state: 'lagos',
      city: 'Yaba',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      views: 156,
      favorites: 4,
      messages: 2,
      status: 'active' as const,
      category: 'electronics',
      postedDate: '1 week ago'
    },
    {
      id: '6',
      title: 'AirPods Pro 2nd Generation',
      price: '₦180,000',
      location: 'Ikeja, Lagos',
      state: 'lagos',
      city: 'Ikeja',
      imageUrl: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
      views: 89,
      favorites: 3,
      messages: 1,
      status: 'expired' as const,
      category: 'electronics',
      postedDate: '2 weeks ago'
    }
  ]

  const reviews = [
    {
      id: '1',
      reviewerName: 'Sarah Johnson',
      reviewerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      comment: 'Great seller! Item was exactly as described and delivered quickly. Highly recommended!',
      date: '2024-01-10',
      helpful: 3
    },
    {
      id: '2',
      reviewerName: 'Michael Chen',
      reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4,
      comment: 'Good communication and fast shipping. Item was in good condition.',
      date: '2024-01-05',
      helpful: 1
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProfileOverview 
            stats={stats}
            isOwner={isOwner}
            userUid={user.uid}
          />
        )
      case 'ads':
        return (
          <ProfileAds 
            ads={ads} 
            isOwner={isOwner} 
          />
        )
      case 'reviews':
        return (
          <ProfileReviews 
            reviews={reviews}
            averageRating={stats.rating}
            totalReviews={reviews.length}
            isOwner={isOwner}
          />
        )
      case 'saved':
        return <ProfileSaved />
      case 'notifications':
        return <ProfileNotifications />
      case 'settings':
        return (
          <ProfileSettings 
            user={user}
            onUpdateUser={onUpdateUser || (() => {})}
          />
        )
      default:
        return (
          <ProfileOverview 
            stats={stats}
            isOwner={isOwner}
            userUid={user.uid}
          />
        )
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <ProfileHeader 
            user={user}
            stats={{ rating: stats.rating, joinedDays: stats.joinedDays }}
            isOwner={isOwner}
            onContactClick={onContactClick}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-h-[400px]">
          {/* Tabs in Main Section */}
          <ProfileTabs isOwner={isOwner} />
          
          {/* Tab Content */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
