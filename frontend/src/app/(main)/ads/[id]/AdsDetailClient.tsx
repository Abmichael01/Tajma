"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/ui/BackButton'
import { useAdDetails } from '@/hooks/useAds'
import { useAuthStore } from '@/store/authStore'
import { useToggleSaveAd } from '@/hooks/useSavedAds'
import ReviewsSection from '@/components/ads/ReviewsSection'
import { useReviewStats } from '@/hooks/useReviews'
import ReportAdModal from '@/components/modals/ReportAdModal'
import ShareAdModal from '@/components/modals/ShareAdModal'
import CallSellerModal from '@/components/modals/CallSellerModal'
import AdDetailSkeleton from '@/components/ui/AdDetailSkeleton'
import { getUserFullName } from '@/utils/user'
import { notificationsApi } from '@/api/notifications'
import { useGetOrCreateChat } from '@/hooks/useChat'
import { chatApi } from '@/api/chat'
import { toast } from 'sonner'
import AdImageGallery from '@/components/ads/AdImageGallery'
import AdProductInfo from '@/components/ads/AdProductInfo'
import AdDescription from '@/components/ads/AdDescription'
import AdInfo from '@/components/ads/AdInfo'
import AdSellerInfo from '@/components/ads/AdSellerInfo'
import AdSafetyTips from '@/components/ads/AdSafetyTips'
import { useLanguage, getDefaultMessages } from '@/hooks/useLanguage'

interface AdsDetailClientProps {
  adId: string // Actually a slug from the URL
}

export default function AdsDetailClient({ adId }: AdsDetailClientProps) {
  const router = useRouter()
  const { data: ad, isLoading, error } = useAdDetails(adId)
  const { user, isAuthenticated } = useAuthStore()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const { mutate: toggleSaveAd, isPending: isTogglingSave } = useToggleSaveAd()
  const { mutate: getOrCreateChat, isPending: isCreatingChat } = useGetOrCreateChat()
  
  // Handle favorite toggle using API
  const handleToggleFavorite = (adId: string) => {
    if (isAuthenticated) {
      toggleSaveAd(adId)
    } else {
      toast.error('Please login to save ads')
      router.push('/login')
    }
  }
  
  // Check if ad is saved (from API response)
  const isFavorite = (adId: string) => {
    return ad?.id === adId && ad?.is_saved === true
  }

  // Check if current user is the ad owner
  const isOwner = user && ad && user.id === ad.seller.id

  // Fetch review stats for the ad
  const { data: reviewStats } = useReviewStats(
    { ad: ad?.id },
    !!ad?.id
  )

  // Get images from backend ad
  const adImages = ad?.images && ad.images.length > 0 
    ? ad.images 
    : ['https://via.placeholder.com/800x600?text=No+Image']

  // Reset image index when ad changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [adId])

  const nextImage = () => {
    if (ad && currentImageIndex < adImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  // Format price
  const formattedPrice = ad?.price
    ? `${ad.currency || 'Fr'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price'

  // Get location from seller
  const location = ad?.seller?.location || 'Location not specified'

  // Get category name
  const categoryName = ad?.category_details?.name || ad?.category || 'Uncategorized'

  // Get seller name
  const sellerName = ad?.seller ? getUserFullName(ad.seller) : 'Unknown Seller'

  // Get seller profile slug
  const sellerProfileSlug = ad?.seller?.username || ad?.seller?.email?.split('@')[0] || 'profile'

  // Get current language and default messages
  const currentLang = useLanguage()
  const defaultMessages = getDefaultMessages(currentLang)

  const handleDefaultMessage = (msg: string) => {
    setContactMessage(msg)
  }

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setShowContactForm(true)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactMessage.trim() || !ad || !ad.seller) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    getOrCreateChat(
      {
        participant2_id: ad.seller.id,
        ad_id: ad.id,
      },
      {
        onSuccess: async (chat) => {
          try {
            // Send the initial message
            await chatApi.sendMessage({
              chat: chat.id,
              content: contactMessage.trim(),
            })
            
            // Clear form and navigate to chat
            setContactMessage('')
            setShowContactForm(false)
            router.push(`/chat?id=${chat.id}`)
          } catch (error: any) {
            console.error('Failed to send message:', error)
            // Still navigate to chat even if message send fails
            setContactMessage('')
            setShowContactForm(false)
            router.push(`/chat?id=${chat.id}`)
          }
        },
        onError: (error: any) => {
          console.error('Failed to create chat:', error)
          toast.error(error?.response?.data?.detail || 'Failed to start conversation')
        },
      }
    )
  }

  const handleCallSeller = async () => {
    if (!ad || !ad.seller) return
    
    // Only send notification if user is authenticated
    if (!isAuthenticated || !user) {
      return
    }
    
    // Send notification in background when button is clicked
    console.log('🔔 Call Seller button clicked - creating notification...')
    try {
      const viewerName = getUserFullName(user)
      console.log('📤 Sending notification:', {
        recipient: ad.seller.id,
        type: 'phone_view',
        viewer: viewerName,
        adId: ad.id
      })
      
      const notification = await notificationsApi.create({
        recipient: ad.seller.id,
        type: 'phone_view',
        title: 'Phone Number Viewed',
        message: `${viewerName} viewed your phone number for the ad "${ad.title}"`,
        related_ad: ad.id,
        related_user: user.id,
      })
      
      console.log('✅ Notification created successfully:', notification)
    } catch (error: any) {
      // Silently handle "already sent today" errors
      const errorMessage = error?.response?.data?.detail || error?.message || ''
      if (errorMessage.includes('already sent today')) {
        console.log('⏭️ Notification already sent today, skipping')
      } else {
        console.error('❌ Failed to notify seller:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
      // Continue anyway - don't block user from seeing phone number
    }
    setIsCallModalOpen(true)
  }

  if (isLoading) {
    return <AdDetailSkeleton />
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ad Not Found</h1>
          <p className="text-gray-600 mb-6">The ad you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="primary">
              Browse Other Ads
                    </Button>
          </Link>
                  </div>
            </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8">
      <div className="container">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <BackButton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - All Content (Desktop) */}
          <div className="hidden lg:flex lg:flex-col lg:col-span-2 lg:space-y-6">
            {/* Image Gallery */}
            <AdImageGallery
              images={adImages}
              title={ad.title}
              currentIndex={currentImageIndex}
              onPrev={prevImage}
              onNext={nextImage}
              onThumbnailClick={setCurrentImageIndex}
            />
            
            {/* Description */}
            <AdDescription description={ad.description || ''} />
            
            {/* Ad Info */}
            {ad.attributes && Object.keys(ad.attributes).length > 0 && (
              <AdInfo attributes={ad.attributes} />
            )}
            
            {/* Reviews Section */}
            <div className="mt-2">
              <ReviewsSection
                adId={ad.id}
                reviewStats={reviewStats}
                isOwner={!!isOwner}
              />
            </div>
          </div>

          {/* Image Gallery (Mobile) */}
          <div className="lg:hidden">
            <AdImageGallery
              images={adImages}
              title={ad.title}
              currentIndex={currentImageIndex}
              onPrev={prevImage}
              onNext={nextImage}
              onThumbnailClick={setCurrentImageIndex}
            />
          </div>

          {/* Product Info (Mobile - First under images) */}
          <div className="lg:hidden mt-6">
            <AdProductInfo
              ad={ad}
              user={user}
              isOwner={!!isOwner}
              isFavorite={isFavorite}
              toggleFavorite={handleToggleFavorite}
              formattedPrice={formattedPrice}
              location={location}
              categoryName={categoryName}
              showContactForm={!!showContactForm}
              contactMessage={contactMessage}
              isCreatingChat={!!isCreatingChat}
              onContactSeller={handleContactSeller}
              onDefaultMessage={handleDefaultMessage}
              onContactMessageChange={setContactMessage}
              onSendMessage={handleSendMessage}
              onCancelContact={() => {
                setShowContactForm(false)
                setContactMessage('')
              }}
              onCallSeller={handleCallSeller}
              onShare={() => setIsShareModalOpen(true)}
              onReport={() => setIsReportModalOpen(true)}
            />
          </div>

          {/* Description (Mobile) */}
          <div className="lg:hidden mt-6">
            <AdDescription description={ad.description || ''} />
          </div>

          {/* Ad Info (Mobile) */}
          {ad.attributes && Object.keys(ad.attributes).length > 0 && (
            <div className="lg:hidden mt-6">
              <AdInfo attributes={ad.attributes} />
            </div>
          )}

          {/* Seller Info (Mobile) */}
          {ad.seller && !isOwner && (
            <div className="lg:hidden mt-6">
              <AdSellerInfo
                seller={ad.seller}
                sellerName={sellerName}
                sellerProfileSlug={sellerProfileSlug}
                reviewStats={reviewStats}
              />
            </div>
          )}

          {/* Right Column (Desktop) */}
          <div className="hidden lg:flex lg:flex-col lg:space-y-6">
            {/* Product Info (Desktop) */}
            <AdProductInfo
              ad={ad}
              user={user}
              isOwner={!!isOwner}
              isFavorite={isFavorite}
              toggleFavorite={handleToggleFavorite}
              formattedPrice={formattedPrice}
              location={location}
              categoryName={categoryName}
              showContactForm={!!showContactForm}
              contactMessage={contactMessage}
              isCreatingChat={!!isCreatingChat}
              onContactSeller={handleContactSeller}
              onDefaultMessage={handleDefaultMessage}
              onContactMessageChange={setContactMessage}
              onSendMessage={handleSendMessage}
              onCancelContact={() => {
                setShowContactForm(false)
                setContactMessage('')
              }}
              onCallSeller={handleCallSeller}
              onShare={() => setIsShareModalOpen(true)}
              onReport={() => setIsReportModalOpen(true)}
            />

            {/* Seller Info (Desktop) */}
            {ad.seller && !isOwner && (
              <AdSellerInfo
                seller={ad.seller}
                sellerName={sellerName}
                sellerProfileSlug={sellerProfileSlug}
                reviewStats={reviewStats}
              />
            )}

            {/* Safety Tips (Desktop) */}
            <AdSafetyTips />
          </div>

          {/* Reviews Section (Mobile) */}
          <div className="lg:hidden mt-8">
            <ReviewsSection
              adId={ad.id}
              reviewStats={reviewStats}
              isOwner={!!isOwner}
            />
          </div>

          {/* Safety Tips (Mobile - Last) */}
          <div className="lg:hidden mt-6">
            <AdSafetyTips />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportAdModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        adId={ad.id}
        adTitle={ad.title}
      />
      <ShareAdModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        adId={ad.id}
        adTitle={ad.title}
      />
      {ad.seller?.phone && (
        <CallSellerModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          phoneNumber={ad.seller.phone}
          sellerName={sellerName}
          sellerId={ad.seller.id}
          adId={ad.id}
          adTitle={ad.title}
        />
      )}
    </div>
  )
}
