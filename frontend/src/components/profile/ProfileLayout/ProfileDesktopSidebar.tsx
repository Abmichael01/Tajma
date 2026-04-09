import React from 'react'
import ProfileHeader from '../ProfileHeader'
import type { UserWithReviewStats } from '@/api/types'

interface ProfileDesktopSidebarProps {
  user: UserWithReviewStats
  stats: { rating: number; joinedDays: number }
  isOwner: boolean
  onContactClick?: () => void
  onCallClick?: () => void
}

export default function ProfileDesktopSidebar({
  user,
  stats,
  isOwner,
  onContactClick,
  onCallClick
}: ProfileDesktopSidebarProps) {
  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      <ProfileHeader 
        user={user}
        stats={stats}
        isOwner={isOwner}
        onContactClick={onContactClick}
        onCallClick={onCallClick}
      />
    </div>
  )
}
