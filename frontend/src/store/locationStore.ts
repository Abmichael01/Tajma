import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LocationState {
  selectedRegion: string
  setSelectedRegion: (region: string) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedRegion: 'All Regions',
      setSelectedRegion: (region) => set({ selectedRegion: region }),
    }),
    {
      name: 'location-storage',
    }
  )
)
