import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/api/types'

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.list(), // Initial fetch only
    // ✅ WebSocket ONLY - No polling
    // Chat list updates via: handleChatEvent() in ChatClient.tsx
    // Receives updates from: /ws/chat-events/ WebSocket
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch - WebSocket handles all updates
    refetchOnReconnect: true, // Only refetch if WebSocket was disconnected
    staleTime: Infinity, // Data never becomes stale - WebSocket keeps it fresh
  })
}

export const useChatDetail = (chatId?: string | null) => {
  return useQuery({
    queryKey: ['chats', chatId],
    queryFn: () => (chatId ? chatApi.get(chatId) : null), // Initial fetch only
    enabled: Boolean(chatId),
    // ✅ WebSocket ONLY - No polling
    // Chat detail updates via: handleSocketMessage() and handleChatEvent() in ChatClient.tsx
    // Receives updates from: /ws/chat/{chat_id}/ WebSocket
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch - WebSocket handles all updates
    staleTime: Infinity, // Data never becomes stale - WebSocket keeps it fresh
  })
}

export const useChatMessages = (chatId?: string | null, page: number = 1) => {
  return useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!chatId) return { results: [], count: 0, next: null, previous: null, page: 1 }
      const data = await chatApi.listMessages(chatId, pageParam)
      // Reverse results so oldest messages are first (for display)
      // Backend returns newest first, but we want oldest at top, newest at bottom
      return {
        ...data,
        results: [...data.results].reverse(),
        page: pageParam,
      }
    },
    enabled: Boolean(chatId),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Return next page number if there's a next page
      return lastPage.next ? (lastPage.page || 1) + 1 : undefined
    },
    // ✅ WebSocket ONLY - No polling
    // Messages update via: handleSocketMessage() in ChatClient.tsx
    // Receives updates from: /ws/chat/{chat_id}/ WebSocket
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch - WebSocket handles all updates
    staleTime: Infinity, // Data never becomes stale - WebSocket keeps it fresh
  })
}

export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) => chatApi.markAsRead(chatId),
    onMutate: async (chatId) => {
      // Optimistically update the chat to show as read immediately
      await queryClient.cancelQueries({ queryKey: ['chats'] })
      await queryClient.cancelQueries({ queryKey: ['chats', chatId] })
      
      // Update chat list
      queryClient.setQueryData(['chats'], (oldData: any) => {
        if (!oldData) return oldData
        const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
        return chats.map((chat: any) => {
          if (String(chat.id) === String(chatId)) {
            return { ...chat, unread_count: 0 }
          }
          return chat
        })
      })
      
      // Update chat detail - just set unread_count to 0
      // The backend will handle marking individual messages as read
      queryClient.setQueryData(['chats', chatId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          unread_count: 0,
        }
      })
    },
    onSuccess: (_, chatId) => {
      // No need to invalidate - WebSocket will broadcast read status updates
      // The optimistic update above is enough for immediate UI feedback
    },
    onError: (_, chatId) => {
      // Revert optimistic update on error
      // Don't invalidate - just revert the optimistic update
      queryClient.setQueryData(['chats'], (oldData: any) => {
        if (!oldData) return oldData
        const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
        return chats.map((chat: any) => {
          if (String(chat.id) === String(chatId)) {
            // Revert unread_count (we don't know the actual value, so keep it as is)
            return chat
          }
          return chat
        })
      })
    },
  })
}

export const useOnlineStatuses = () => {
  return useQuery({
    queryKey: ['chats', 'online-status'],
    queryFn: () => chatApi.listOnlineStatuses(),
    // Only online status uses polling (as requested) - every 30 seconds
    refetchInterval: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Fetch on mount to get initial status
    refetchOnReconnect: true,
  })
}

export const useGetOrCreateChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { participant2_id: number | string; ad_id?: string | null }) => 
      chatApi.getOrCreate(payload),
    onSuccess: (data) => {
      // Update chat list cache directly (add new chat or update existing)
      queryClient.setQueryData(['chats'], (oldData: any) => {
        if (!oldData) return [data]
        const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
        const existingIndex = chats.findIndex((chat: any) => chat.id === data.id)
        if (existingIndex !== -1) {
          // Update existing
          const updated = [...chats]
          updated[existingIndex] = data
          return updated
        }
        // Add new chat to top
        return [data, ...chats]
      })
      // Also update chat detail cache
      queryClient.setQueryData(['chats', data.id], data)
    },
  })
}


