"use client"

import React, { useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProfileTabs from '../ProfileTabs'
import ProfileMobileView from '../ProfileMobileView'
import { useUserAds } from '@/hooks/useAds'
import { useSellerReviews, useReviewStats } from '@/hooks/useReviews'
import { useSavedAds } from '@/hooks/useSavedAds'
import type { User, Ad, UserWithReviewStats } from '@/api/types'

import ProfileSellerBanner from './ProfileSellerBanner'
import ProfileTabContent from './ProfileTabContent'
import ProfileDesktopSidebar from './ProfileDesktopSidebar'
import ProfileMobileHeaderWrapper from './ProfileMobileHeaderWrapper'

interface ProfileLayoutProps {
  user: UserWithReviewStats
  profileSlug: string
  isOwner?: boolean
  onContactClick?: () => void
  onCallClick?: () => void
  onUpdateUser?: (updates: Partial<User>) => void
}

const getJoinedDays = (joinedDate?: string | null) => {
  if (!joinedDate) return 0
  const joined = new Date(joinedDate)
  if (isNaN(joined.getTime())) return 0
  const diff = Date.now() - joined.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function ProfileLayout({ 
  user,
  profileSlug,
  isOwner = false, 
  onContactClick,
  onCallClick,
  onUpdateUser 
}: ProfileLayoutProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab')
  const containerRef = useRef<HTMLDivElement>(null)
  const prevTabRef = useRef<string>(activeTab || '')

  useEffect(() => {
    // Only auto-redirect to default tab on desktop
    if (!activeTab && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const defaultTab = isOwner ? 'overview' : 'ads'
      router.replace(`/profile/${profileSlug}?tab=${defaultTab}`, { scroll: false })
    }
  }, [activeTab, isOwner, profileSlug, router])

  useEffect(() => {
    const currentTab = activeTab || ''
    if (prevTabRef.current !== currentTab && prevTabRef.current !== '') {
      const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
        document.body.scrollTo({ top: 0, behavior: 'smooth' })
      }
      scrollToTop()
      const t1 = setTimeout(scrollToTop, 100)
      const t2 = setTimeout(scrollToTop, 300)
      prevTabRef.current = currentTab
      return () => { clearTimeout(t1); clearTimeout(t2); }
    }
    prevTabRef.current = currentTab
  }, [activeTab])

  const joinedDays = getJoinedDays(user.date_joined)
  const sellerProfileComplete = Boolean(user.phone && user.location && user.address)

  const { data: backendAds, isLoading: adsLoading } = useUserAds(user.id)
  const { data: reviewsData, isLoading: reviewsLoading } = useSellerReviews(user.id)
  const { data: savedAdsData } = useSavedAds(1, 1)
  const savedAdsCount = savedAdsData?.count || 0
  
  const reviews = Array.isArray(reviewsData) ? reviewsData : []
  const { data: reviewStats } = useReviewStats({ seller: user.id }, !!user.id)
  const finalReviewStats = user.review_stats || reviewStats
  const responseRate = user.response_stats?.response_rate_1h ?? 0

  const ads = useMemo(() => (backendAds && Array.isArray(backendAds)) ? backendAds : [], [backendAds])

  const stats = useMemo(() => ({
    totalAds: ads.length,
    activeAds: ads.filter(ad => ad.status === 'published').length,
    soldItems: ads.filter(ad => ad.status === 'archived').length,
    totalViews: ads.reduce((sum, ad) => sum + (ad.views || 0), 0),
    totalFavorites: isOwner ? savedAdsCount : 0,
    responseRate,
    rating: finalReviewStats?.average_rating || 0,
    joinedDays
  }), [ads, joinedDays, finalReviewStats, savedAdsCount, isOwner, responseRate])

  const handleMobileNavigate = (section: string) => router.push(`/profile/${profileSlug}?tab=${section}`)
  const handleMobileBack = () => router.push(`/profile/${profileSlug}`)

  const shouldShowMobileView = typeof window !== 'undefined' && 
    window.innerWidth < 1024 && activeTab !== null &&
    ['overview', 'ads', 'leads', 'saved', 'reviews', 'settings', 'support'].includes(activeTab)

  const contentProps = {
    activeTab, isOwner, profileSlug, user, ads, adsLoading,
    reviews, reviewsLoading, finalReviewStats, stats,
    onUpdateUser: onUpdateUser || (() => {})
  }

  if (shouldShowMobileView) {
    const titles: Record<string, string> = {
      overview: 'Overview', ads: isOwner ? 'My Ads' : 'Ads',
      saved: 'Saved', reviews: 'Reviews', leads: 'Potential Clients', 
      settings: 'Settings', support: 'Support & Help'
    }
    return (
      <div className="container py-0">
        <ProfileMobileView title={titles[activeTab!] || 'Profile'} onBack={handleMobileBack}>
          <ProfileTabContent {...contentProps} />
        </ProfileMobileView>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <ProfileDesktopSidebar user={user} stats={{ rating: stats.rating, joinedDays: stats.joinedDays }} isOwner={isOwner} onContactClick={onContactClick} onCallClick={onCallClick} />
        <ProfileMobileHeaderWrapper user={user} stats={{ rating: stats.rating, joinedDays: stats.joinedDays }} isOwner={isOwner} onContactClick={onContactClick} onCallClick={onCallClick} ads={ads} adsLoading={adsLoading} reviews={reviews} reviewsLoading={reviewsLoading} finalReviewStats={finalReviewStats} profileSlug={profileSlug} activeTab={activeTab} onNavigate={handleMobileNavigate} />
        
        <div className="hidden lg:flex flex-1 min-h-[400px] flex-col">
          <ProfileSellerBanner isOwner={isOwner} sellerProfileComplete={sellerProfileComplete} />
          <ProfileTabs isOwner={isOwner} />
          <div className="mt-3">
            <ProfileTabContent {...contentProps} />
          </div>
        </div>
      </div>
    </div>
  )
}
