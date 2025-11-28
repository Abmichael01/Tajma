"use client"

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MapPin,
  Calendar,
  Shield,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Phone,
  Globe,
  Mail
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
  onCallClick?: () => void
}

export default function ProfileHeader({ user, stats, isOwner = false, onContactClick, onCallClick }: ProfileHeaderProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const fullName = getUserFullName(user)

  // Mock bio if not provided
  const bio = user.bio || "I'm a passionate seller on Tajma Marketplace, offering quality products at great prices. With years of experience in electronics and gadgets, I ensure all my items are in excellent condition. Feel free to contact me for any questions!"
  
  const shouldTruncate = bio.length > 120
  const displayBio = shouldTruncate && !isBioExpanded ? bio.slice(0, 120) + '...' : bio

  // Format website URL
  const formatWebsite = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  const websiteUrl = formatWebsite(user.website)

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

      {/* Additional User Info */}
      <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
        {/* Location */}
        {user.location && (
          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{user.location}</span>
          </div>
        )}

        {/* Website */}
        {websiteUrl && (
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-secondary hover:text-secondary/80 hover:underline truncate"
            >
              {user.website}
            </a>
          </div>
        )}

        {/* Email (only show if owner) */}
        {user.email && isOwner && (
          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
      </div>

      {/* Contact Buttons */}
      {!isOwner && (
        <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
          {onContactClick && (
            <Button
            onClick={onContactClick}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
              size="sm"
          >
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            Contact Seller
            </Button>
          )}
          {user.phone && onCallClick && (
            <Button
              onClick={onCallClick}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              Call Seller
            </Button>
          )}
        </div>
      )}
    </div>
  )
}