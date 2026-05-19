import { create } from 'zustand'

export interface InAppBannerItem {
  id: string
  title: string
  body: string
  avatarUrl?: string
  type: string
  deepLink?: string
  ttlMs?: number
}

interface InAppNotificationState {
  current: InAppBannerItem | null
  queue: InAppBannerItem[]
  recentIds: string[]
  show: (item: InAppBannerItem) => void
  dismiss: () => void
}

const MAX_RECENT = 50

export const useInAppNotificationStore = create<InAppNotificationState>((set, get) => ({
  current: null,
  queue: [],
  recentIds: [],

  show: (item) => {
    const { current, queue, recentIds } = get()
    if (recentIds.includes(item.id)) return
    const nextRecent = [item.id, ...recentIds].slice(0, MAX_RECENT)
    if (current) {
      set({ queue: [...queue, item], recentIds: nextRecent })
      return
    }
    set({ current: item, recentIds: nextRecent })
  },

  dismiss: () => {
    const { queue } = get()
    const [next, ...rest] = queue
    set({ current: next ?? null, queue: rest })
  },
}))
