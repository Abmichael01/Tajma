"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Eye, 
  Heart, 
  Share2, 
  Flag, 
  MessageSquare,
  Phone,
  Calendar,
  Tag,
  Edit,
  Archive,
  Trash2,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateAd, useDeleteAd } from '@/hooks/useAds'
import type { Ad, User, ReviewStats } from '@/api/types'
import { getUserFullName } from '@/utils/user'
import { useLanguage, getDefaultMessages } from '@/hooks/useLanguage'

interface AdProductInfoProps {
  ad: Ad
  user: User | null
  isOwner: boolean
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  formattedPrice: string
  location: string
  categoryName: string
  showContactForm: boolean
  contactMessage: string
  isCreatingChat: boolean
  onContactSeller: () => void
  onDefaultMessage: (msg: string) => void
  onContactMessageChange: (value: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onCancelContact: () => void
  onCallSeller: () => void
  onShare: () => void
  onReport: () => void
  className?: string
}

export default function AdProductInfo({
  ad,
  user,
  isOwner,
  isFavorite,
  toggleFavorite,
  formattedPrice,
  location,
  categoryName,
  showContactForm,
  contactMessage,
  isCreatingChat,
  onContactSeller,
  onDefaultMessage,
  onContactMessageChange,
  onSendMessage,
  onCancelContact,
  onCallSeller,
  onShare,
  onReport,
  className = ''
}: AdProductInfoProps) {
  const router = useRouter()
  const updateAd = useUpdateAd(ad.slug)
  const deleteAd = useDeleteAd(ad.slug)
  
  // Get current language and translated default messages
  const currentLang = useLanguage()
  const defaultMessages = getDefaultMessages(currentLang)

  const handleArchive = async () => {
    try {
      const newStatus = ad.status === 'archived' ? 'published' : 'archived'
      await updateAd.mutateAsync({ status: newStatus })
      toast.success(newStatus === 'archived' ? 'Ad archived successfully' : 'Ad unarchived successfully')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update ad status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return
    }
    try {
      await deleteAd.mutateAsync()
      toast.success('Ad deleted successfully')
      // Redirect to user's ads page
      if (user?.id) {
        router.push(`/profile/${user.id}/ads`)
      } else {
        router.push('/')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete ad')
    }
  }

  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight flex-1">{ad.title}</h1>
        <button
          onClick={() => toggleFavorite(ad.id)}
          className={`p-2 transition-colors flex-shrink-0 ${
            isFavorite(ad.id)
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title={isFavorite(ad.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite(ad.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className={`text-2xl sm:text-3xl mb-6 ${formattedPrice === 'Contact for price' ? 'text-primary' : 'text-primary'}`}>
        {formattedPrice}
      </div>

      <div className="space-y-3 mb-6 text-sm sm:text-base">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span>{ad.views || 0} views</span>
        </div>
        {ad.saved_count !== undefined && ad.saved_count > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="w-4 h-4 flex-shrink-0" />
            <span>{ad.saved_count} {ad.saved_count === 1 ? 'person saved' : 'people saved'}</span>
          </div>
        )}
        {categoryName && (
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4 flex-shrink-0" />
            <span className="capitalize">{categoryName}</span>
          </div>
        )}
        {ad.created_at && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{new Date(ad.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {isOwner ? (
        <>
          {/* Owner Stats */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ad Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Views</p>
                <p className="text-lg font-bold text-gray-900">{ad.views || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Favorites</p>
                <p className="text-lg font-bold text-gray-900">{ad.saved_count || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Messages</p>
                <p className="text-lg font-bold text-gray-900">0</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="text-lg font-bold capitalize text-gray-900">{ad.status}</p>
              </div>
            </div>
          </div>

          {/* Owner Actions */}
          <div className="space-y-2">
            <Link href={`/ads/${ad.slug}/edit`} className="block">
              <Button 
                variant="outline" 
                className="w-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Ad
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
              size="sm"
              onClick={handleArchive}
              disabled={updateAd.isPending}
            >
              <Archive className="w-4 h-4 mr-2" />
              {updateAd.isPending ? 'Updating...' : ad.status === 'archived' ? 'Unarchive' : 'Archive'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
              size="sm"
              onClick={handleDelete}
              disabled={deleteAd.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteAd.isPending ? 'Deleting...' : 'Delete Ad'}
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            {!showContactForm ? (
              <Button 
                className="w-full" 
                size="lg"
                onClick={onContactSeller}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Seller
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Default Messages */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">Quick messages:</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultMessages.map((msg, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onDefaultMessage(msg)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 hover:border-primary transition-colors"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <form onSubmit={onSendMessage} className="space-y-2">
                  <textarea
                    value={contactMessage}
                    onChange={(e) => onContactMessageChange(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Type your message here..."
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onCancelContact}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingChat || !contactMessage.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isCreatingChat ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {ad.seller?.phone && (
              <Button 
                variant="secondary" 
                className="w-full" 
                size="lg" 
                onClick={onCallSeller}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Seller
              </Button>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={onReport}
            >
              <Flag className="w-4 h-4 mr-2" />
              Report
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

