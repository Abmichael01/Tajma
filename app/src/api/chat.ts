import apiClient from './apiClient'
import type {
  ChatDetail,
  ChatMessage,
  ChatSummary,
  ChatGetOrCreateRequest,
  SendMessageRequest,
  UserOnlineStatus,
} from './types'

const basePath = '/chats/'
const messagesPath = '/messages/'
const onlineStatusPath = '/online-status/'

export const chatApi = {
  list: async (): Promise<ChatSummary[]> => {
    try {
      const response = await apiClient.get<ChatSummary[] | { results: ChatSummary[] }>(basePath)

      // Handle null or undefined response
      if (!response.data) {
        console.warn('chatApi.list: No data in response')
        return []
      }

      // Handle paginated response
      if (typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
        return (response.data as { results: ChatSummary[] }).results
      }

      // Handle direct array response
      if (Array.isArray(response.data)) {
        return response.data
      }

      // Unexpected format
      console.warn('chatApi.list: Unexpected response format:', response.data)
      return []
    } catch (error) {
      console.error('chatApi.list: Error fetching chats:', error)
      return []
    }
  },

  get: async (chatId: string): Promise<ChatDetail> => {
    const response = await apiClient.get<ChatDetail>(`${basePath}${chatId}/`)
    return response.data
  },

  getOrCreate: async (payload: ChatGetOrCreateRequest): Promise<ChatDetail> => {
    const response = await apiClient.post<ChatDetail>(`${basePath}get_or_create/`, payload)
    return response.data
  },

  markAsRead: async (chatId: string): Promise<void> => {
    await apiClient.post(`${basePath}${chatId}/mark_read/`)
  },

  listMessages: async (chatId: string, page: number = 1): Promise<{ results: ChatMessage[]; count: number; next: string | null; previous: string | null }> => {
    try {
      const response = await apiClient.get<ChatMessage[] | { results: ChatMessage[]; count: number; next: string | null; previous: string | null }>(messagesPath, {
        params: { chat: chatId, page },
      })

      // Handle null or undefined response
      if (!response.data) {
        console.warn('listMessages: No data in response')
        return { results: [], count: 0, next: null, previous: null }
      }

      // Handle paginated response
      if (typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
        const paginatedData = response.data as { results: ChatMessage[]; count: number; next: string | null; previous: string | null }
        return {
          results: paginatedData.results,
          count: paginatedData.count || paginatedData.results.length,
          next: paginatedData.next || null,
          previous: paginatedData.previous || null,
        }
      }

      // Handle direct array response (backward compatibility)
      if (Array.isArray(response.data)) {
        return {
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null,
        }
      }

      // Unexpected format
      console.warn('listMessages: Unexpected response format:', response.data)
      return { results: [], count: 0, next: null, previous: null }
    } catch (error) {
      console.error('listMessages: Error fetching messages:', error)
      return { results: [], count: 0, next: null, previous: null }
    }
  },

  sendMessage: async (payload: SendMessageRequest): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(messagesPath, payload)
    return response.data
  },

  sendWithAttachment: async (
    chatId: string,
    content: string,
    fileUri: string,
    type: 'image' | 'audio' | 'document',
    parentMessageId?: string,
    clientId?: string
  ): Promise<ChatMessage> => {
    const formData = new FormData()
    formData.append('chat', chatId)
    formData.append('content', content)
    formData.append('message_type', type)
    if (parentMessageId) {
      formData.append('parent_message_id', parentMessageId)
    }
    if (clientId) {
      formData.append('client_id', clientId)
    }

    const filename = fileUri.split('/').pop() || 'file'
    // Extract extension for better MIME type matching
    const ext = filename.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'

    if (type === 'image') {
      mimeType = 'image/jpeg'
      formData.append('attachment', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any)
    }
    else if (type === 'audio') {
      // Default to m4a for expo-audio HIGH_QUALITY
      mimeType = 'audio/m4a'
      if (ext === 'wav') mimeType = 'audio/wav'
      else if (ext === 'mp3') mimeType = 'audio/mpeg'
      else if (ext === 'amr') mimeType = 'audio/amr'

      // If filename has no extension, append .m4a as default for expo-audio
      if (!filename.includes('.')) {
        formData.append('attachment', {
          uri: fileUri,
          name: `${filename}.m4a`,
          type: mimeType,
        } as any)
      } else {
        formData.append('attachment', {
          uri: fileUri,
          name: filename,
          type: mimeType,
        } as any)
      }
    }
    else if (type === 'document') {
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'doc' || ext === 'docx') mimeType = 'application/msword'
      else if (ext === 'xls' || ext === 'xlsx') mimeType = 'application/vnd.ms-excel'

      formData.append('attachment', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any)
    }

    const response = await apiClient.post<ChatMessage>(messagesPath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  listOnlineStatuses: async (): Promise<UserOnlineStatus[]> => {
    try {
      const response = await apiClient.get<UserOnlineStatus[] | { results: UserOnlineStatus[] }>(onlineStatusPath)

      // Handle null or undefined response
      if (!response.data) {
        console.warn('listOnlineStatuses: No data in response')
        return []
      }

      // Handle paginated response
      if (typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
        return (response.data as { results: UserOnlineStatus[] }).results
      }

      // Handle direct array response
      if (Array.isArray(response.data)) {
        return response.data
      }

      // Unexpected format
      console.warn('listOnlineStatuses: Unexpected response format:', response.data)
      return []
    } catch (error) {
      console.error('listOnlineStatuses: Error fetching online statuses:', error)
      return []
    }
  },

  setOnline: async (): Promise<UserOnlineStatus> => {
    const response = await apiClient.post<UserOnlineStatus>(`${onlineStatusPath}set_online/`)
    return response.data
  },

  setOffline: async (): Promise<UserOnlineStatus> => {
    const response = await apiClient.post<UserOnlineStatus>(`${onlineStatusPath}set_offline/`)
    return response.data
  },

  clearChat: async (chatId: string): Promise<void> => {
    await apiClient.post(`${basePath}${chatId}/clear/`)
  },

  blockUser: async (userId: string | number): Promise<void> => {
    await apiClient.post(`/auth/profile/${userId}/block/`)
  },

  muteChat: async (chatId: string, isMuted: boolean): Promise<void> => {
    await apiClient.post(`${basePath}${chatId}/mute/`, { is_muted: isMuted })
  },

  deleteMessages: async (messageIds: string[]): Promise<void> => {
    await apiClient.post(`${messagesPath}bulk_delete/`, { message_ids: messageIds })
  },
}

export type { ChatSummary, ChatDetail, ChatMessage, UserOnlineStatus }
