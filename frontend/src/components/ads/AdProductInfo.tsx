"use client"

import React from 'react'
import { useRouter, Link } from '@/i18n/routing'
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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('common')
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
      toast.success(newStatus === 'archived' ? t('ad_archived_success') : t('ad_unarchived_success'))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('failed_update_status'))
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirm_delete_ad'))) {
      return
    }
    try {
      await deleteAd.mutateAsync()
      toast.success(t('ad_deleted_success'))
      // Redirect to user's ads page
      if (user?.id) {
        router.push(`/profile/${user.id}/ads`)
      } else {
        router.push('/')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('failed_delete_ad_msg'))
    }
  }

  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 rounded-xl ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight flex-1">{ad.title}</h1>
        <button
          onClick={() => toggleFavorite(ad.id)}
          className={`p-2 transition-colors flex-shrink-0 rounded-full ${
            isFavorite(ad.id)
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title={isFavorite(ad.id) ? t('remove_favorite') : t('add_favorite')}
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
            <span>{ad.saved_count} {ad.saved_count === 1 ? t('person_saved') : t('people_saved')}</span>
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
        <div className="space-y-6 pt-6 border-t border-gray-100">
          {/* Compact Owner Stats */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{t('views')}</span>
              <span className="text-lg font-black text-gray-900 leading-none">{ad.views || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{t('favorites')}</span>
              <span className="text-lg font-black text-gray-900 leading-none">{ad.saved_count || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{t('status_label')}</span>
              <span className="text-sm font-bold text-primary capitalize leading-none">{ad.status}</span>
            </div>
          </div>

          {/* Owner Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/ads/${ad.slug}/edit`}>
              <Button 
                variant="outline" 
                className="w-fit border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5 font-bold px-6 rounded-full" 
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Ad
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-fit bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-6 rounded-full" 
              size="sm"
              onClick={handleArchive}
              disabled={updateAd.isPending}
            >
              <Archive className="w-4 h-4 mr-2" />
              {ad.status === 'archived' ? 'Restore' : 'Archive'}
            </Button>
            <Button 
              variant="ghost" 
              className="w-fit bg-red-50 hover:bg-red-100 text-red-600 font-bold px-6 rounded-full" 
              size="sm"
              onClick={handleDelete}
              disabled={deleteAd.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-fit bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-6 rounded-full"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('share')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {!showContactForm ? (
              <Button 
                className="w-full h-12 rounded-full font-bold" 
                size="lg"
                onClick={onContactSeller}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {t('contact_seller')}
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Default Messages */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">{t('quick_messages')}</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultMessages.map((msg, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onDefaultMessage(msg)}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-full hover:bg-gray-50 hover:border-primary transition-colors"
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
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder={t('type_message_placeholder')}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onCancelContact}
                      className="flex-1 rounded-full"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingChat || !contactMessage.trim()}
                      size="sm"
                      className="flex-1 rounded-full"
                    >
                      {isCreatingChat ? t('sending') : t('send')}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {ad.seller?.phone && (
              <Button 
                variant="secondary" 
                className="w-full h-12 rounded-full font-bold" 
                size="lg" 
                onClick={onCallSeller}
              >
                <Phone className="w-5 h-5 mr-2" />
                {t('call_seller')}
              </Button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 h-10 rounded-full bg-gray-50/50 hover:bg-gray-100 text-gray-600 font-medium"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('share')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 h-10 rounded-full bg-gray-50/50 hover:bg-gray-100 text-gray-600 font-medium"
              onClick={onReport}
            >
              <Flag className="w-4 h-4 mr-2" />
              {t('report')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

