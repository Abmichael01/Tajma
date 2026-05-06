import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LocationState {
  selectedCountry: string
  setSelectedCountry: (country: string) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCountry: 'All Countries',
      setSelectedCountry: (country) => set({ selectedCountry: country }),
    }),
    {
      name: 'location-storage',
    }
  )
)
