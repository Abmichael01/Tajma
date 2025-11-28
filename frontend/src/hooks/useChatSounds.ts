"use client"

import { useRef, useCallback } from 'react'

/**
 * Hook for playing chat sound effects
 * Uses HTML5 Audio API with local sound files from public folder
 * 
 * Place sound files in: frontend/public/sounds/
 * Required files:
 * - typing.mp3 (or .wav, .ogg) - Sound when participant is typing
 * - sent.mp3 (or .wav, .ogg) - Sound when message is sent
 * - received.mp3 (or .wav, .ogg) - Sound when new message is received
 */
export const useChatSounds = () => {
  // Sound file paths from public folder
  // Files should be placed in: public/sounds/
  // Supported formats: .mp3, .wav, .ogg (using actual file extensions from user's files)
  const soundUrls = {
    // Subtle typing sound (keyboard typing)
    typing: '/sounds/typing.wav',
    // Message sent confirmation (soft pop/click)
    sent: '/sounds/sent.wav',
    // New message received (notification bell) - user has .mp3 file
    received: '/sounds/received.mp3',
  }

  // Cache audio elements for better performance
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Get or create audio element
  const getAudio = useCallback((soundType: keyof typeof soundUrls): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null

    // Check cache first
    if (audioCache.current.has(soundType)) {
      return audioCache.current.get(soundType)!
    }

    // Create new audio element
    const audio = new Audio(soundUrls[soundType])
    audio.volume = 0.3 // Set volume to 30% (adjustable)
    audio.preload = 'auto' // Preload for instant playback
    
    // Cache it
    audioCache.current.set(soundType, audio)
    
    return audio
  }, [])

  // Play sound with optional volume override
  const playSound = useCallback((soundType: keyof typeof soundUrls, volume?: number) => {
    if (typeof window === 'undefined') return

    const audio = getAudio(soundType)
    if (!audio) return

    try {
      // Reset to beginning if already playing
      if (audio.currentTime > 0) {
        audio.currentTime = 0
      }

      // Set volume if provided
      if (volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, volume))
      }

      // Play sound
      audio.play().catch((error) => {
        // Silently fail if user hasn't interacted with page yet
        // (browsers require user interaction before playing audio)
        if (process.env.NODE_ENV === 'development') {
          console.debug('Could not play sound (user interaction required):', error)
        }
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error playing sound:', error)
      }
    }
  }, [getAudio])

  // Specific sound functions for convenience
  const playTypingSound = useCallback(() => {
    playSound('typing', 0.2) // Lower volume for typing (20%)
  }, [playSound])

  const playSentSound = useCallback(() => {
    playSound('sent', 0.4) // Medium volume for sent (40%)
  }, [playSound])

  const playReceivedSound = useCallback(() => {
    playSound('received', 0.5) // Higher volume for received (50%)
  }, [playSound])

  return {
    playTypingSound,
    playSentSound,
    playReceivedSound,
    playSound, // Generic function for custom sounds
  }
}

