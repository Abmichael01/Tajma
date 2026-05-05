"use client"

import React from 'react'
import Image from 'next/image'
import { useRouter, Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Star, Shield } from 'lucide-react'
import type { User, ReviewStats, ResponseStats } from '@/api/types'
import { getUserFullName } from '@/utils/user'
import { leadsApi } from '@/api/leads'
import { useAuthStore } from '@/store/authStore'
import { getMediaUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'


interface AdSellerInfoProps {
  seller: User & { response_stats?: ResponseStats }
  sellerName: string
  sellerProfileSlug: string
  reviewStats?: ReviewStats
  className?: string
}

export default function AdSellerInfo({
  seller,
  sellerName,
  sellerProfileSlug,
  reviewStats,
  className = ''
}: AdSellerInfoProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const fullName = getUserFullName(seller)
  const stats = seller.response_stats

  const responseRate = stats?.response_rate_1h ?? stats?.response_rate_2h ?? 0

  let responseTimeText = t('response_time_varies')
  if (stats?.response_rate_1h && stats.response_rate_1h >= 80) {
    responseTimeText = t('responds_within_1h')
  } else if (stats?.response_rate_2h && stats.response_rate_2h >= 80) {
    responseTimeText = t('responds_within_2h')
  } else if (stats?.avg_response_minutes != null) {
    if (stats.avg_response_minutes <= 60) {
      responseTimeText = t('responds_about_1h')
    } else if (stats.avg_response_minutes <= 120) {
      responseTimeText = t('responds_about_2h')
    } else {
      responseTimeText = t('responds_in_minutes', { minutes: Math.round(stats.avg_response_minutes) })
    }
  }

  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 rounded-xl ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">{t('seller_information')}</h3>

      <div className="flex items-center gap-3 mb-4">
        {seller.avatar ? (
          <Image
            src={getMediaUrl(seller.avatar)}

            alt={sellerName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {sellerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">{sellerName}</h4>
            {seller.is_verified && (
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">
              {reviewStats?.average_rating
                ? `${reviewStats.average_rating.toFixed(1)} (${reviewStats.total_reviews || 0} ${t('reviews')})`
                : t('no_reviews_yet')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
        {seller.date_joined && (
          <div>{t('member_since')} {new Date(seller.date_joined).getFullYear()}</div>
        )}
        <div>{t('response_rate_label')}: {responseRate}%</div>
        <div>{responseTimeText}</div>
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          if (isAuthenticated && currentUser?.id !== seller.id) {
            leadsApi.recordInteraction({
              seller_id: String(seller.id),
              source: 'profile_view'
            }).catch(console.error)
          }
          router.push(`/profile/${sellerProfileSlug}`)
        }}
      >
        {t('view_profile')}
      </Button>
    </div>
  )
}

