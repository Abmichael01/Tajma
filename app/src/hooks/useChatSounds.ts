import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

/**
 * Hook for playing chat sound effects in React Native.
 * Uses expo-audio for optimized playback.
 */
export const useChatSounds = () => {
  const sentSound = useAudioPlayer(require('@/assets/sounds/sent.wav'));
  const receivedSound = useAudioPlayer(require('@/assets/sounds/received.mp3'));
  const typingSound = useAudioPlayer(require('@/assets/sounds/typing.wav'));

  const playSentSound = useCallback(() => {
    if (sentSound) {
      sentSound.seekTo(0);
      sentSound.play();
    }
  }, [sentSound]);

  const playReceivedSound = useCallback(() => {
    if (receivedSound) {
      receivedSound.seekTo(0);
      receivedSound.play();
    }
  }, [receivedSound]);

  const playTypingSound = useCallback(() => {
    if (typingSound) {
      typingSound.seekTo(0);
      typingSound.play();
    }
  }, [typingSound]);

  return {
    playSentSound,
    playReceivedSound,
    playTypingSound,
  };
};
