import { create } from 'zustand'

interface AudioState {
  playingAudioId: string | null
  setPlayingAudioId: (id: string | null) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  playingAudioId: null,
  setPlayingAudioId: (id) => set({ playingAudioId: id }),
}))
