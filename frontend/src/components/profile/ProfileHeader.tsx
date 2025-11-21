"use client"

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MapPin,
  Calendar,
  Shield,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { User, UserWithReviewStats } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'

interface ProfileHeaderProps {
  user: UserWithReviewStats
  stats: {
    rating: number
    joinedDays: number
  }
  isOwner?: boolean
  onContactClick?: () => void
}

export default function ProfileHeader({ user, stats, isOwner = false, onContactClick }: ProfileHeaderProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const fullName = getUserFullName(user)

  // Mock bio if not provided
  const bio = user.bio || "I'm a passionate seller on Tajma Marketplace, offering quality products at great prices. With years of experience in electronics and gadgets, I ensure all my items are in excellent condition. Feel free to contact me for any questions!"
  
  const shouldTruncate = bio.length > 120
  const displayBio = shouldTruncate && !isBioExpanded ? bio.slice(0, 120) + '...' : bio

  return (
    <div className="bg-white border border-gray-200 p-4 sm:p-6 mb-6">
      {/* User Info */}
      <div className="text-center mb-6">
        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4">
          <AvatarImage src={user.avatar || undefined} alt={fullName} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-lg sm:text-xl">
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{fullName}</h1>
          {user.is_verified && (
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          )}
        </div>
        
        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-3">
          <Star className="w-4 h-4" />
          <span className="font-bold">{stats.rating}</span>
          <span className="text-xs sm:text-sm text-gray-500 ml-1">({stats.joinedDays} days)</span>
        </div>
        
        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          {user.location && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              {user.location}
            </div>
          )}
          <div className="flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            Joined {stats.joinedDays} days ago
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">About</h3>
        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          <p>{displayBio}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsBioExpanded(!isBioExpanded)}
              className="text-secondary hover:text-secondary/80 font-medium mt-2 flex items-center gap-1 text-xs sm:text-sm"
            >
              {isBioExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  See less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  See all
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contact Button */}
      {!isOwner && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={onContactClick}
            className="w-full bg-secondary text-secondary-foreground px-3 sm:px-4 py-2 hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            Contact Seller
          </button>
        </div>
      )}
    </div>
  )
}