"use client"

import React from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { getMediaUrl } from '@/lib/utils'
import type { ChatSummary } from '@/api/types'

interface AdBannerProps {
  chat: ChatSummary
}

export default function AdBanner({ chat }: AdBannerProps) {
  if (!chat.ad_title) return null

  return (
    <div className="p-2 sm:p-3 border-b border-gray-200 bg-white z-10 relative">
      <div className="flex items-center gap-2 sm:gap-3">
        {chat.ad_image && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 overflow-hidden flex-shrink-0 rounded border border-gray-100">
            <Image
              src={getMediaUrl(chat.ad_image)}
              alt={chat.ad_title || 'Ad image'}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{chat.ad_title}</h3>
          {chat.ad_price && (
            <p className="text-sm font-bold text-primary">
              {chat.ad_currency || 'XOF'} {parseFloat(chat.ad_price).toLocaleString()}
            </p>
          )}
        </div>
        {chat.ad_slug && (
          <Link href={`/ads/${chat.ad_slug}`} className="text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors">
            View
          </Link>
        )}
      </div>
    </div>
  )
}
