import React from 'react'
import ProfileOverview from '../ProfileOverview'
import ProfileAds from '../ProfileAds'
import ProfileReviews from '../ProfileReviews'
import ProfileSettings from '../ProfileSettings'
import ProfileSaved from '../ProfileSaved'
import ProfileNotifications from '../ProfileNotifications'
import ProfileSupport from '../ProfileSupport'
import LeadsContent from '../ProfileLeads'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import type { User, Ad, UserWithReviewStats } from '@/api/types'

interface ProfileTabContentProps {
  activeTab: string | null
  isOwner: boolean
  profileSlug: string
  user: UserWithReviewStats
  ads: Ad[]
  adsLoading: boolean
  reviews: any[]
  reviewsLoading: boolean
  finalReviewStats: any
  stats: any
  onUpdateUser: (updates: Partial<User>) => void
}

export default function ProfileTabContent({
  activeTab,
  isOwner,
  profileSlug,
  user,
  ads,
  adsLoading,
  reviews,
  reviewsLoading,
  finalReviewStats,
  stats,
  onUpdateUser
}: ProfileTabContentProps) {
  const currentTab = !isOwner && activeTab === 'overview' 
    ? 'ads' 
    : (activeTab || (isOwner ? 'overview' : 'ads'))

  switch (currentTab) {
    case 'overview':
      if (!isOwner) {
        return (
          <>
            {adsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <MarketplaceLoader size="md" message="Loading ads..." />
              </div>
            ) : (
              <ProfileAds ads={ads} isOwner={isOwner} />
            )}
          </>
        )
      }
      return (
        <ProfileOverview stats={stats} isOwner={isOwner} userUid={profileSlug} />
      )
    case 'ads':
      return (
        <>
          {adsLoading ? (
            <div className="py-12 flex items-center justify-center">
              <MarketplaceLoader size="md" message="Loading ads..." />
            </div>
          ) : (
            <ProfileAds ads={ads} isOwner={isOwner} />
          )}
        </>
      )
    case 'reviews':
      return (
        <ProfileReviews 
          reviews={reviews}
          reviewStats={finalReviewStats}
          isLoading={reviewsLoading}
          isOwner={isOwner}
        />
      )
    case 'leads':
      return isOwner ? <LeadsContent /> : null
    case 'saved':
      return <ProfileSaved />
    case 'notifications':
      return <ProfileNotifications />
    case 'support':
      return isOwner ? <ProfileSupport /> : null
    case 'settings':
      return (
        <ProfileSettings 
          user={user}
          onUpdateUser={onUpdateUser}
        />
      )
    default:
      return isOwner ? (
        <ProfileOverview stats={stats} isOwner={isOwner} userUid={profileSlug} />
      ) : (
        <ProfileAds ads={ads} isOwner={isOwner} />
      )
  }
}
