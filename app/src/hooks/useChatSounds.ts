import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';

// Quieter than the OS default — these play when the user is already inside
// the chat, so they're a soft confirmation, not an alert. 0.0 - 1.0 scale.
const RECEIVED_VOLUME = 0.25;
const SENT_VOLUME = 0.3;
const TYPING_VOLUME = 0.2;

export const useChatSounds = () => {
  const sentSound = useAudioPlayer(require('@/assets/sounds/sent.wav'));
  const receivedSound = useAudioPlayer(require('@/assets/sounds/received.mp3'));
  const typingSound = useAudioPlayer(require('@/assets/sounds/typing.wav'));

  // expo-audio's player.volume is a runtime property; set once after each
  // player is constructed. Re-applying on every render is cheap and resilient
  // to player recreation (e.g. when the asset reloads in dev).
  useEffect(() => {
    if (sentSound) sentSound.volume = SENT_VOLUME;
    if (receivedSound) receivedSound.volume = RECEIVED_VOLUME;
    if (typingSound) typingSound.volume = TYPING_VOLUME;
  }, [sentSound, receivedSound, typingSound]);

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
