"use client"

import React, { useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import ProfileOverview from './ProfileOverview'
import ProfileAds from './ProfileAds'
import ProfileReviews from './ProfileReviews'
import ProfileSettings from './ProfileSettings'
import ProfileSaved from './ProfileSaved'
import ProfileNotifications from './ProfileNotifications'
import ProfileMobileNav from './ProfileMobileNav'
import ProfileMobileView from './ProfileMobileView'
import { Button } from '@/components/ui/button'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useUserAds } from '@/hooks/useAds'
import { useSellerReviews, useReviewStats } from '@/hooks/useReviews'
import { useSavedAds } from '@/hooks/useSavedAds'
import type { User, Ad, UserWithReviewStats } from '@/api/types'

interface ProfileLayoutProps {
  user: UserWithReviewStats
  profileSlug: string
  isOwner?: boolean
  onContactClick?: () => void
  onCallClick?: () => void
  onUpdateUser?: (updates: Partial<User>) => void
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
  const activeTab = searchParams.get('tab') // Don't default to 'overview', use null if not present
  const containerRef = useRef<HTMLDivElement>(null)
  const prevTabRef = useRef<string>(activeTab || '')

  // Scroll to top when tab actually changes (not on initial load)
  useEffect(() => {
    const currentTab = activeTab || ''
    // Only scroll if tab actually changed
    if (prevTabRef.current !== currentTab && prevTabRef.current !== '') {
      // Use multiple methods to ensure scroll works
      const scrollToTop = () => {
        // Try scrolling the window
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Also try scrolling the document element
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
        // Also try scrolling the body
        document.body.scrollTo({ top: 0, behavior: 'smooth' })
      }
      
      // Scroll immediately
      scrollToTop()
      
      // Scroll after delays to ensure content has updated
      const timer1 = setTimeout(scrollToTop, 100)
      const timer2 = setTimeout(scrollToTop, 300)
      
      // Update previous tab
      prevTabRef.current = currentTab
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    } else {
      // Update previous tab on initial load
      prevTabRef.current = currentTab
    }
  }, [activeTab])

  const getJoinedDays = (joinedDate?: string | null) => {
    if (!joinedDate) return 0
    const joined = new Date(joinedDate)
    if (isNaN(joined.getTime())) return 0
    const diff = Date.now() - joined.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  const joinedDays = getJoinedDays(user.date_joined)
  // Seller profile is complete if phone, location (region), and address are set
  const sellerProfileComplete = Boolean(
    user.phone && 
    user.location && 
    user.address
  )

  // Fetch user ads from API - backend handles showing all statuses for owner, only published for others
  const { data: backendAds, isLoading: adsLoading } = useUserAds(user.id)
  
  // Fetch reviews for this seller
  const { data: reviewsData, isLoading: reviewsLoading } = useSellerReviews(user.id)
  
  // Fetch saved ads count for favorites (only if owner)
  const { data: savedAdsData } = useSavedAds(1, 1) // Just get first page to get count
  const savedAdsCount = savedAdsData?.count || 0
  
  // Ensure reviews is always an array
  const reviews = Array.isArray(reviewsData) ? reviewsData : []
  
  // Get review stats from user profile or fetch separately
  const { data: reviewStats } = useReviewStats({ seller: user.id }, !!user.id)
  const finalReviewStats = user.review_stats || reviewStats

  // Use response stats from profile when available (fallback to 0)
  const responseRate = user.response_stats?.response_rate_1h ?? 0

  // Use backend ads directly
  const ads = useMemo(() => {
    if (backendAds && Array.isArray(backendAds) && backendAds.length > 0) {
      return backendAds
    }
    return []
  }, [backendAds])

  // Calculate stats from real ads and reviews
  const stats = useMemo(() => {
    const totalAds = ads.length
    const activeAds = ads.filter(ad => ad.status === 'published').length
    const archivedAds = ads.filter(ad => ad.status === 'archived').length
    const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0)
    
    return {
      totalAds,
      activeAds,
      soldItems: archivedAds, // Using archived as "sold" for now
      totalViews,
      totalFavorites: isOwner ? savedAdsCount : 0, // Use saved ads count for owner, 0 for others
      responseRate,
      rating: finalReviewStats?.average_rating || 0,
      joinedDays
    }
  }, [ads, joinedDays, finalReviewStats, savedAdsCount, isOwner, responseRate])

  const handleMobileNavigate = (section: string) => {
    // Update URL with tab query parameter - URL is the source of truth
    router.push(`/profile/${profileSlug}?tab=${section}`)
  }

  const handleMobileBack = () => {
    // Remove tab from URL to show normal profile view (header + links)
    router.push(`/profile/${profileSlug}`)
  }

  // Determine default tab: 'ads' for visitors, 'overview' for owners
  // Visitors should never see overview, so block it
  const getDefaultTab = () => {
    if (!isOwner && activeTab === 'overview') {
      return 'ads' // Force ads for visitors trying to access overview
    }
    if (activeTab) return activeTab
    return isOwner ? 'overview' : 'ads'
  }

  const renderTabContent = () => {
    const currentTab = getDefaultTab()
    switch (currentTab) {
      case 'overview':
        // Only show overview for owners
        if (!isOwner) {
          return (
            <>
              {adsLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <MarketplaceLoader size="md" message="Loading ads..." />
                </div>
              ) : (
                <ProfileAds 
                  ads={ads} 
                  isOwner={isOwner} 
                />
              )}
            </>
          )
        }
        return (
          <ProfileOverview 
            stats={stats}
            isOwner={isOwner}
            userUid={profileSlug}
          />
        )
      case 'ads':
        return (
          <>
            {adsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <MarketplaceLoader size="md" message="Loading ads..." />
              </div>
            ) : (
              <ProfileAds 
                ads={ads} 
                isOwner={isOwner} 
              />
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
        // Default to ads for visitors, overview for owners
        return isOwner ? (
          <ProfileOverview 
            stats={stats}
            isOwner={isOwner}
            userUid={profileSlug}
          />
        ) : (
          <>
            {adsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <MarketplaceLoader size="md" message="Loading ads..." />
              </div>
            ) : (
              <ProfileAds 
                ads={ads} 
                isOwner={isOwner} 
              />
            )}
          </>
        )
    }
  }

  const renderMobileContent = () => {
    // Determine which tabs should show full-screen mobile view
    const mobileFullScreenTabs = ['overview', 'ads', 'saved', 'reviews', 'settings']
    
    // If visitor tries to access overview, redirect to ads
    if (!isOwner && activeTab === 'overview') {
      const newUrl = `/profile/${profileSlug}?tab=ads`
      router.replace(newUrl, { scroll: false })
      return null
    }
    
    if (!activeTab || !mobileFullScreenTabs.includes(activeTab)) {
      return null
    }

    if (activeTab === 'overview') {
      // Only show overview for owners
      if (!isOwner) {
        return null
      }
      return (
        <ProfileMobileView title="Overview" onBack={handleMobileBack}>
          <ProfileOverview 
            stats={stats}
            isOwner={isOwner}
            userUid={profileSlug}
          />
        </ProfileMobileView>
      )
    }
    if (activeTab === 'ads') {
      return (
        <ProfileMobileView title={isOwner ? 'My Ads' : 'Ads'} onBack={handleMobileBack}>
          {adsLoading ? (
            <div className="py-12 flex items-center justify-center">
              <MarketplaceLoader size="md" message="Loading ads..." />
            </div>
          ) : (
            <ProfileAds 
              ads={ads} 
              isOwner={isOwner} 
            />
          )}
        </ProfileMobileView>
      )
    }
    if (activeTab === 'saved') {
      return (
        <ProfileMobileView title="Saved" onBack={handleMobileBack}>
          <ProfileSaved />
        </ProfileMobileView>
      )
    }
    if (activeTab === 'reviews') {
      return (
        <ProfileMobileView title="Reviews" onBack={handleMobileBack}>
          <ProfileReviews 
            reviews={reviews}
            reviewStats={finalReviewStats}
            isLoading={reviewsLoading}
            isOwner={isOwner}
          />
        </ProfileMobileView>
      )
    }
    if (activeTab === 'settings') {
      return (
        <ProfileMobileView title="Settings" onBack={handleMobileBack}>
          <ProfileSettings 
            user={user}
            onUpdateUser={onUpdateUser || (() => {})}
          />
        </ProfileMobileView>
      )
    }
    return null
  }

  // Redirect to ads tab if visitor tries to access overview or has no tab
  useEffect(() => {
    if (!isOwner) {
      // If visitor has no tab or tries to access overview, redirect to ads
      if (!activeTab || activeTab === 'overview') {
        const newUrl = `/profile/${profileSlug}?tab=ads`
        // Use replace to update URL without adding to history
        router.replace(newUrl, { scroll: false })
      }
    }
  }, [activeTab, isOwner, profileSlug, router])

  // Mobile: Show full-screen view when navigating to a section (only on mobile)
  // Only show full-screen view if there's a tab in the URL
  const shouldShowMobileView = typeof window !== 'undefined' && 
    window.innerWidth < 1024 && 
    activeTab !== null &&
    ['overview', 'ads', 'saved', 'reviews', 'settings'].includes(activeTab)

  if (shouldShowMobileView) {
    return (
      <div className="container py-0">
        {renderMobileContent()}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Desktop only */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <ProfileHeader 
            user={user}
            stats={{ rating: stats.rating, joinedDays: stats.joinedDays }}
            isOwner={isOwner}
            onContactClick={onContactClick}
            onCallClick={onCallClick}
          />
        </div>
        
        {/* Mobile: Right Section First */}
        <div className="lg:hidden w-full">
          <ProfileHeader 
            user={user}
            stats={{ rating: stats.rating, joinedDays: stats.joinedDays }}
            isOwner={isOwner}
            onContactClick={onContactClick}
            onCallClick={onCallClick}
            ads={ads}
            adsLoading={adsLoading}
            reviews={reviews}
            reviewsLoading={reviewsLoading}
            reviewStats={finalReviewStats}
            profileSlug={profileSlug}
            onNavigate={handleMobileNavigate}
          />
          
          {/* Mobile Navigation Links */}
          <div className="mt-6">
            <ProfileMobileNav 
              isOwner={isOwner} 
              onNavigate={handleMobileNavigate}
              currentView={activeTab}
            />
          </div>
        </div>
        
        {/* Main Content - Desktop */}
        <div className="hidden lg:flex flex-1 min-h-[400px] flex-col bg-white">
          {isOwner && !sellerProfileComplete && (
            <div className="border border-gray-200 bg-gray-50 px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Become a seller</p>
                <p className="text-xs text-gray-600 mt-1">
                  Share contact info and business details when you're ready to start selling.
                </p>
              </div>
              <Link href="/seller/setup">
                <Button variant="outline" size="sm">
                  Set up seller profile
                </Button>
              </Link>
            </div>
          )}

          {/* Tabs in Main Section */}
          <ProfileTabs isOwner={isOwner} />
          
          {/* Tab Content */}
          <div className="mt-6 bg-white">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
