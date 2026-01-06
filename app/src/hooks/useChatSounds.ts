import { Audio } from 'expo-av';
import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook for playing chat sound effects in React Native
 * Uses expo-av for audio playback
 * 
 * Sound files location: app/src/assets/sounds/
 */
export const useChatSounds = () => {
  // Cache sound objects for better performance
  const soundCache = useRef<Map<string, Audio.Sound>>(new Map());

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      // Unload all cached sounds when component unmounts
      soundCache.current.forEach((sound) => {
        sound.unloadAsync().catch(() => {
          // Silently ignore errors during cleanup
        });
      });
      soundCache.current.clear();
    };
  }, []);

  // Load or get cached sound
  const getSound = useCallback(async (soundType: 'sent' | 'received'): Promise<Audio.Sound | null> => {
    try {
      // Check cache first
      if (soundCache.current.has(soundType)) {
        return soundCache.current.get(soundType)!;
      }

      // Load sound file
      const soundFiles = {
        sent: require('@/assets/sounds/sent.wav'),
        received: require('@/assets/sounds/received.mp3'),
      };

      const { sound } = await Audio.Sound.createAsync(soundFiles[soundType]);
      
      // Cache it
      soundCache.current.set(soundType, sound);
      
      return sound;
    } catch (error) {
      console.error('Error loading sound:', error);
      return null;
    }
  }, []);

  // Play sound with optional volume
  const playSound = useCallback(async (soundType: 'sent' | 'received', volume: number = 0.5) => {
    try {
      const sound = await getSound(soundType);
      if (!sound) return;

      // Set volume (0.0 to 1.0)
      await sound.setVolumeAsync(volume);
      
      // Replay from beginning if already playing
      await sound.setPositionAsync(0);
      
      // Play sound
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getSound]);

  // Specific sound functions
  const playSentSound = useCallback(() => {
    playSound('sent', 0.4);
  }, [playSound]);

  const playReceivedSound = useCallback(() => {
    playSound('received', 0.5);
  }, [playSound]);

  return {
    playSentSound,
    playReceivedSound,
    playSound,
  };
};
