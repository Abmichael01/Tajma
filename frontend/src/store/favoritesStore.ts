import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[] // Array of ad IDs
  addFavorite: (adId: string) => void
  removeFavorite: (adId: string) => void
  toggleFavorite: (adId: string) => void
  isFavorite: (adId: string) => boolean
  clearFavorites: () => void
  getFavoritesCount: () => number
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (adId: string) => {
        set((state) => {
          if (state.favorites.includes(adId)) {
            return state
          }
          return { favorites: [...state.favorites, adId] }
        })
      },

      removeFavorite: (adId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== adId)
        }))
      },

      toggleFavorite: (adId: string) => {
        const { favorites, addFavorite, removeFavorite } = get()
        if (favorites.includes(adId)) {
          removeFavorite(adId)
        } else {
          addFavorite(adId)
        }
      },

      isFavorite: (adId: string) => {
        return get().favorites.includes(adId)
      },

      clearFavorites: () => {
        set({ favorites: [] })
      },

      getFavoritesCount: () => {
        return get().favorites.length
      }
    }),
    {
      name: 'tajma-favorites-storage', // localStorage key
    }
  )
)

