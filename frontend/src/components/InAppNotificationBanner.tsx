"use client"

/**
 * InAppNotificationBanner — slide-from-top banner shown while a tab of this
 * app is visible. The service worker (public/sw.js) suppresses OS-level
 * toasts in that case and postMessages the payload to the visible client so
 * this component can render it.
 *
 * Driven by useInAppNotificationStore. Auto-dismisses after 4s; click to
 * follow the deep link.
 */
import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Bell, ChevronRight, Eye, Heart, MessageCircleMore, Megaphone, Star } from 'lucide-react'

import { useInAppNotificationStore } from '@/store/inAppNotificationStore'

const DEFAULT_TTL_MS = 4000

function iconForType(type: string) {
  switch (type) {
    case 'message':
      return MessageCircleMore
    case 'favorite':
      return Heart
    case 'review':
      return Star
    case 'ad_status':
      return Megaphone
    case 'phone_view':
    case 'ad_view':
    case 'view':
      return Eye
    default:
      return Bell
  }
}

export default function InAppNotificationBanner() {
  const current = useInAppNotificationStore((s) => s.current)
  const dismiss = useInAppNotificationStore((s) => s.dismiss)
  const router = useRouter()

  const handleClick = useCallback(() => {
    const link = current?.deepLink
    dismiss()
    if (link) router.push(link)
  }, [current?.deepLink, dismiss, router])

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(dismiss, current.ttlMs ?? DEFAULT_TTL_MS)
    return () => clearTimeout(timer)
  }, [current, dismiss])

  const Icon = iconForType(current?.type ?? 'other')

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[1000] flex justify-center px-3 pt-3 sm:px-6"
      aria-live="polite"
    >
      <AnimatePresence>
        {current && (
          <motion.button
            key={current.id}
            type="button"
            onClick={handleClick}
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl hover:bg-slate-50"
          >
            {current.avatarUrl ? (
              <img
                src={current.avatarUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1EC]">
                <Icon className="h-5 w-5 text-[#FF4F18]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">
                {current.title || 'Tajma'}
              </div>
              {current.body && (
                <div className="line-clamp-2 text-xs text-slate-600">{current.body}</div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
