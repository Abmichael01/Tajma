import { create } from "zustand";

export interface InAppBannerItem {
  id: string;
  title: string;
  body: string;
  avatarUrl?: string;
  type: string;
  /** Chat ID this notification belongs to, if any. Used to suppress the
   *  banner when the user is already on that chat screen. */
  chatId?: string;
  deepLink?: string;
  ttlMs?: number;
}

interface InAppNotificationState {
  current: InAppBannerItem | null;
  queue: InAppBannerItem[];
  recentIds: string[];
  /** ID of the chat the user is currently viewing, if any. Set by the chat
   *  screen on mount, cleared on unmount. When non-null, message-type
   *  banners for that chat are dropped — the user is already seeing the
   *  message arrive in real-time on the screen. */
  activeChatId: string | null;
  show: (item: InAppBannerItem) => void;
  dismiss: () => void;
  setActiveChatId: (chatId: string | null) => void;
}

// Bounded so a runaway notification storm can't grow memory.
const MAX_RECENT = 50;

export const useInAppNotificationStore = create<InAppNotificationState>(
  (set, get) => ({
    current: null,
    queue: [],
    recentIds: [],
    activeChatId: null,

    show: (item) => {
      const { current, queue, recentIds, activeChatId } = get();

      // Suppress message banners for the chat the user is actively viewing.
      // Other types (favorite, review, ad_status, …) still surface because
      // they're not the thing the user is already looking at.
      if (item.type === "message" && item.chatId && item.chatId === activeChatId) {
        return;
      }

      if (recentIds.includes(item.id)) {
        // Same notification id already shown — drop the duplicate.
        return;
      }
      const nextRecent = [item.id, ...recentIds].slice(0, MAX_RECENT);
      if (current) {
        set({ queue: [...queue, item], recentIds: nextRecent });
        return;
      }
      set({ current: item, recentIds: nextRecent });
    },

    dismiss: () => {
      const { queue } = get();
      const [next, ...rest] = queue;
      set({ current: next ?? null, queue: rest });
    },

    setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  }),
);
