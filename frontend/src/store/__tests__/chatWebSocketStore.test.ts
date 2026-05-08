import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChatWebSocketStore } from '../chatWebSocketStore'

const resetStore = () => {
  useChatWebSocketStore.setState({
    ws: null,
    isConnected: false,
    subscribedChats: new Set(),
    pendingSubscriptions: new Set(),
    pendingMessages: new Map(),
    pendingReadReceipts: new Set(),
    pendingTyping: new Map(),
    reconnectAttempts: 0,
    reconnectTimeout: null,
    pingInterval: null,
    connectionHealthCheck: null,
    lastPongTime: Date.now(),
    onChatMessage: undefined,
    onChatListUpdate: undefined,
    onTyping: undefined,
    onMessageStatusUpdate: undefined,
    onMarkedRead: undefined,
  })
}

const setupOpenSocket = () => {
  const sentFrames: any[] = []
  const socket = {
    readyState: WebSocket.OPEN,
    send: vi.fn((frame: string) => {
      sentFrames.push(JSON.parse(frame))
    }),
    close: vi.fn(),
  }

  useChatWebSocketStore.setState({
    ws: socket as unknown as WebSocket,
    isConnected: true,
  })

  return { socket, sentFrames }
}

afterEach(() => {
  resetStore()
  vi.restoreAllMocks()
})

describe('chatWebSocketStore pending realtime actions', () => {
  it('queues mark_read while subscribing to a chat', () => {
    const { sentFrames } = setupOpenSocket()

    useChatWebSocketStore.getState().markAsRead('chat-1')

    expect(sentFrames).toContainEqual({
      type: 'subscribe',
      chat_id: 'chat-1',
    })
    expect(useChatWebSocketStore.getState().pendingSubscriptions.has('chat-1')).toBe(true)
    expect(useChatWebSocketStore.getState().pendingReadReceipts.has('chat-1')).toBe(true)
  })

  it('keeps the latest typing state while subscription is pending', () => {
    const { sentFrames } = setupOpenSocket()

    useChatWebSocketStore.getState().sendTyping('chat-1', true)
    useChatWebSocketStore.getState().sendTyping('chat-1', false)

    expect(sentFrames.filter((frame) => frame.type === 'subscribe')).toHaveLength(1)
    expect(useChatWebSocketStore.getState().pendingTyping.get('chat-1')).toBe(false)
  })
})
