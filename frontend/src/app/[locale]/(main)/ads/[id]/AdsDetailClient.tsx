"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from '@/i18n/routing'
import { useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/ui/BackButton'
import { useAdDetails, useUpdateAd } from '@/hooks/useAds'
import { useAuthStore } from '@/store/authStore'
import { useToggleSaveAd } from '@/hooks/useSavedAds'
import { useUpdateAdminAd, useDeleteAdminAd } from '@/hooks/useAdmin'
import { useSearchParams } from 'next/navigation'
import ReviewsSection from '@/components/ads/ReviewsSection'
import { useReviewStats } from '@/hooks/useReviews'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import ReportAdModal from '@/components/modals/ReportAdModal'
import ShareAdModal from '@/components/modals/ShareAdModal'
import CallSellerModal from '@/components/modals/CallSellerModal'
import AdDetailSkeleton from '@/components/ui/AdDetailSkeleton'
import { getUserFullName } from '@/utils/user'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Edit, ShieldCheck } from 'lucide-react'
import { notificationsApi } from '@/api/notifications'
import { useGetOrCreateChat } from '@/hooks/useChat'
import { chatApi } from '@/api/chat'
import { leadsApi } from '@/api/leads'
import { toast } from 'sonner'
import AdImageGallery from '@/components/ads/AdImageGallery'
import AdProductInfo from '@/components/ads/AdProductInfo'
import AdDescription from '@/components/ads/AdDescription'
import AdInfo from '@/components/ads/AdInfo'
import AdSellerInfo from '@/components/ads/AdSellerInfo'
import AdSafetyTips from '@/components/ads/AdSafetyTips'
import AdMap from '@/components/ads/AdMap'
import { useLanguage, getDefaultMessages } from '@/hooks/useLanguage'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

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
  const updateAdMutation = useUpdateAd(adId)
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  
  // Admin / Management hooks
  const updateAd = useUpdateAdminAd()
  const deleteAd = useDeleteAdminAd()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle favorite toggle using API
  const handleToggleFavorite = (adId: string) => {
    if (isAuthenticated) {
      toggleSaveAd(adId)

      // Track as lead if saving
      if (ad && !ad.is_saved && ad.seller) {
        leadsApi.recordInteraction({
          seller_id: String(ad.seller.id),
          source: 'save_ad',
          ad_id: ad.id
        }).catch(console.error)
      }
    } else {
      toast.error('Please login to save ads')
      router.push('/login')
    }
  }

  // Check if ad is saved (from API response)
  const isFavorite = (adId: string) => {
    return ad?.id === adId && ad?.is_saved === true
  }

  // Check if current user is the ad owner or an admin
  const isOwner = user && ad && user.id === ad.seller.id
  const isAdmin = user && (user.is_staff || user.is_superuser)
  const canManage = isOwner || isAdmin

  // Fetch review stats for the ad
  const { data: reviewStats } = useReviewStats(
    { ad: ad?.id },
    !!ad?.id
  )

  const { categoryTree } = useCategories()

  const categoryPath = useMemo(() => {
    if (!ad?.category || !categoryTree) return null
    
    const findCategoryPath = (categories: any[], slug: string, path: any[] = []): any[] | null => {
      for (const cat of categories) {
        if (cat.slug === slug || cat.id === slug) return [...path, cat]
        if (cat.children || cat.subcategories) {
          const found = findCategoryPath(cat.children || cat.subcategories || [], slug, [...path, cat])
          if (found) return found
        }
      }
      return null
    }
    
    return findCategoryPath(categoryTree, ad.category)
  }, [ad?.category, categoryTree])

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
    ? `${ad.currency || 'XOF'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price'

  // Get location from seller
  const location = ad?.seller?.location || 'Location not specified'

  // Get category name
  const categoryName = ad?.category_details?.name || ad?.category || 'Uncategorized'

  // Get seller name
  const sellerName = ad?.seller ? getUserFullName(ad.seller) : 'Unknown Seller'

  // Get seller profile slug
  const sellerProfileSlug = String(ad?.seller?.username || ad?.seller?.id || 'profile')

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
          // Track as lead
          leadsApi.recordInteraction({
            seller_id: String(ad.seller.id),
            source: 'phone_view', // Or 'message_sent' if we add it
            ad_id: ad.id
          }).catch(console.error)

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
      // ...
    }

    // Track as lead
    leadsApi.recordInteraction({
      seller_id: String(ad.seller.id),
      source: 'phone_view',
      ad_id: ad.id
    }).catch(console.error)

    setIsCallModalOpen(true)
  }
  
  const handlePublish = async () => {
    try {
      await updateAdMutation.mutateAsync({ status: "published" })
      toast.success('Listing published successfully!')
      router.replace(`/ads/${adId}`)
    } catch (error) {
      console.error('Failed to publish:', error)
      toast.error('Failed to publish listing. Please try again.')
    }
  }

  const handleAdminStatusChange = async (newStatus: string) => {
    if (!ad) return
    try {
      await updateAd.mutateAsync({
        id: ad.id,
        data: { status: newStatus as 'draft' | 'published' | 'archived' },
      })
    } catch (error: any) {
      console.error('Failed to update ad status:', error)
    }
  }

  const handleAdminDelete = async () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!ad) return
    try {
      await deleteAd.mutateAsync(ad.id)
      router.push('/')
    } catch (error) {
      console.error('Failed to delete ad:', error)
    }
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
    <div className="min-h-screen bg-gray-50/50 py-4 sm:py-8">
      {/* Preview Action Bar */}
      {isPreview && ad && ad.status === 'draft' && (
        <div className="bg-primary/10 border-b border-primary/20 mb-6 py-4 sticky top-0 z-50 backdrop-blur-sm">
          <div className="container flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 leading-tight">Preview Mode</h4>
                <p className="text-xs text-gray-600">This ad is currently a draft. Review it before publishing.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white border-gray-200"
                onClick={() => router.push(`/create-ad?edit=${ad.id}`)}
              >
                Edit Draft
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white px-8 font-bold"
                onClick={handlePublish}
                disabled={updateAdMutation.isPending}
              >
                {updateAdMutation.isPending ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Bar */}
      {canManage && ad && (
        <div className="bg-amber-50 border-b border-amber-100 mb-6 py-3">
          <div className="container flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold">
                {isAdmin ? 'Management Tools (Admin)' : 'Management Tools (Owner)'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">Status:</span>
              <Select
                value={ad.status}
                onValueChange={handleAdminStatusChange}
              >
                <SelectTrigger className="w-32 bg-white border-amber-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Link href={`/admin/ads?edit=${ad.id}`}>
                <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-900 gap-1.5 h-9">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-100 h-9 gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-2 mb-6 sm:mb-8 text-xs sm:text-sm text-gray-400">
          <BackButton variant="outline" className="mr-2" />
          {categoryPath && categoryPath.map((cat, index) => (
            <React.Fragment key={cat.slug || cat.id}>
              {index > 0 && <span className="text-gray-300 mx-1">&gt;</span>}
              <Link 
                href={`/category/${cat.slug}`}
                className="hover:text-primary transition-colors font-medium text-gray-400"
              >
                {cat.name}
              </Link>
            </React.Fragment>
          ))}
          {categoryPath && (
            <>
              <span className="text-gray-300 mx-1">&gt;</span>
              <span className="text-primary font-medium">{ad.title}</span>
            </>
          )}
          {!categoryPath && (
             <span className="text-primary font-medium">{ad.title}</span>
          )}
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

            {/* Map Section */}
            {(ad.latitude && ad.longitude) && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
                <AdMap 
                  latitude={ad.latitude ?? undefined} 
                  longitude={ad.longitude ?? undefined} 
                  title={ad.title} 
                  locationName={(ad.location_name || ad.location) ?? undefined} 
                />
              </div>
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

          {/* Map (Mobile) */}
          {(ad.latitude && ad.longitude) && (
            <div className="lg:hidden mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
              <AdMap 
                latitude={ad.latitude ?? undefined} 
                longitude={ad.longitude ?? undefined} 
                title={ad.title} 
                locationName={(ad.location_name || ad.location) ?? undefined} 
              />
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
        />
      )}

      {ad && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          title={`Delete Ad: ${ad.title}?`}
          description="Are you sure you want to delete this ad? This action cannot be undone and will remove the advertisement permanently from the marketplace."
          isLoading={deleteAd.isPending}
        />
      )}
    </div>
  )
}
