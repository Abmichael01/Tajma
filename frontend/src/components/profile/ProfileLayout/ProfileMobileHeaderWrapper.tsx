import React from 'react'
import ProfileHeader from '../ProfileHeader'
import ProfileMobileNav from '../ProfileMobileNav'
import ProfileAds from '../ProfileAds'
import ProfileReviews from '../ProfileReviews'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { FileText, Star } from 'lucide-react'
import type { Ad, UserWithReviewStats } from '@/api/types'

interface ProfileMobileHeaderWrapperProps {
  user: UserWithReviewStats
  stats: { rating: number; joinedDays: number }
  isOwner: boolean
  onContactClick?: () => void
  onCallClick?: () => void
  ads: Ad[]
  adsLoading: boolean
  reviews: any[]
  reviewsLoading: boolean
  finalReviewStats: any
  profileSlug: string
  activeTab: string | null
  onNavigate: (section: string) => void
}

export default function ProfileMobileHeaderWrapper({
  user,
  stats,
  isOwner,
  onContactClick,
  onCallClick,
  ads,
  adsLoading,
  reviews,
  reviewsLoading,
  finalReviewStats,
  profileSlug,
  activeTab,
  onNavigate
}: ProfileMobileHeaderWrapperProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'ads' | 'reviews'>('ads')

  return (
    <div className="lg:hidden w-full pb-10">
      <ProfileHeader 
        user={user}
        stats={stats}
        isOwner={isOwner}
        onContactClick={onContactClick}
        onCallClick={onCallClick}
        ads={ads}
        adsLoading={adsLoading}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        reviewStats={finalReviewStats}
        profileSlug={profileSlug}
        onNavigate={onNavigate}
      />
      
      <div className="mt-8">
        {isOwner ? (
          <div className="px-4">
            <ProfileMobileNav 
              isOwner={isOwner} 
              onNavigate={onNavigate}
              currentView={activeTab}
            />
          </div>
        ) : (
          <>
            {/* Rounded Tab Switcher - Full Width */}
            <div className="sticky top-0 z-30 pt-2 pb-1 bg-gray-50/50 backdrop-blur-sm">
              <div className="bg-white border border-gray-100 rounded-2xl flex items-center overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveSubTab('ads')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-black transition-all whitespace-nowrap ${
                    activeSubTab === 'ads'
                      ? 'text-secondary border-b-2 border-secondary bg-secondary/5'
                      : 'text-gray-400 hover:text-gray-900 border-b-2 border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Ads
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] opacity-60 font-bold">{ads.length}</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('reviews')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-black transition-all whitespace-nowrap ${
                    activeSubTab === 'reviews'
                      ? 'text-secondary border-b-2 border-secondary bg-secondary/5'
                      : 'text-gray-400 hover:text-gray-900 border-b-2 border-transparent'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Reviews
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] opacity-60 font-bold">{reviews.length}</span>
                </button>
              </div>
            </div>

            <div>
              {activeSubTab === 'ads' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 py-6">
                  {adsLoading ? (
                    <div className="py-20 flex items-center justify-center">
                      <MarketplaceLoader size="md" message="Loading ads..." />
                    </div>
                  ) : (
                    <ProfileAds ads={ads} isOwner={isOwner} hideContainer={true} />
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 py-6">
                  <ProfileReviews 
                    reviews={reviews}
                    reviewStats={finalReviewStats}
                    isLoading={reviewsLoading}
                    isOwner={isOwner}
                    hideContainer={true}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
