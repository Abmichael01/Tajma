"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatWebSocketStore } from '@/store/chatWebSocketStore'

/**
 * Global chat connection component (WhatsApp/Telegram pattern)
 * 
 * Responsibilities:
 * - Maintains WebSocket connection when authenticated
 * - Handles connection lifecycle (connect/disconnect)
 * - Keeps connection alive across page navigation
 * 
 * NOTE: Handlers are set by useChatRealtime hook (context-aware)
 * This component ONLY manages the connection, not the handlers.
 */
export default function GlobalChatConnection() {
  const { isAuthenticated } = useAuthStore()
  const { connect, disconnect } = useChatWebSocketStore()

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - keep connection alive across page navigation
      // Only disconnect on logout (handled by isAuthenticated change)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // connect and disconnect are stable Zustand functions

  // Handle visibility change - send ping when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const { ws } = useChatWebSocketStore.getState()
      if (document.visibilityState === 'visible' && ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping' }))
          useChatWebSocketStore.setState({ lastPongTime: Date.now() })
        } catch (error) {
          console.error('Failed to send ping on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}

