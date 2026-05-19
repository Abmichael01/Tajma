"use client"

/**
 * NotificationLayer — global mount point for realtime notification UI.
 *
 *   • Calls useInitializeNotifications() so the notification WS connects on
 *     every authenticated page, not only when /alerts is open.
 *   • Listens to service-worker postMessage events: when the worker decides
 *     to suppress the OS toast (because a visible tab exists), it forwards
 *     the payload here so we can show the in-app banner instead.
 *   • Renders InAppNotificationBanner.
 *
 * Mounted from the root layout so it is always available.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import InAppNotificationBanner from '@/components/InAppNotificationBanner'
import { useInitializeNotifications } from '@/hooks/useInitializeNotifications'
import { useInAppNotificationStore } from '@/store/inAppNotificationStore'

interface PushMessage {
  type: 'push:notification' | 'push:notificationclick'
  title?: string
  body?: string
  data?: Record<string, any>
}

export default function NotificationLayer() {
  useInitializeNotifications()
  const router = useRouter()

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handler = (event: MessageEvent<PushMessage>) => {
      const msg = event.data
      if (!msg || typeof msg !== 'object') return

      if (msg.type === 'push:notification') {
        const data = msg.data ?? {}
        useInAppNotificationStore.getState().show({
          id: String(data.notification_id ?? Date.now()),
          title: msg.title ?? 'Tajma',
          body: msg.body ?? '',
          type: String(data.type ?? 'other'),
          deepLink: typeof data.deep_link === 'string' ? data.deep_link : undefined,
        })
        return
      }

      if (msg.type === 'push:notificationclick') {
        const link = msg.data?.deep_link
        if (typeof link === 'string' && link) router.push(link)
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [router])

  return <InAppNotificationBanner />
}
