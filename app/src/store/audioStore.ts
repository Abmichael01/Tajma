import { create } from 'zustand';

interface AudioState {
    activeAudioUri: string | null;
    setActiveAudioUri: (uri: string | null) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
    activeAudioUri: null,
    setActiveAudioUri: (uri) => set({ activeAudioUri: uri }),
}));
