import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/api/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  
  // Actions
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
  completeSellerSetup: () => void
  setHasHydrated: (hydrated: boolean) => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        })
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          })
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      completeSellerSetup: () => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, is_seller_account_setup: true }
          })
        }
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated })
      },

      fetchUser: async () => {
        const { authApi } = await import('@/api/auth')
        try {
          const user = await authApi.getCurrentUser()
          set({ user, isAuthenticated: true })
        } catch (error) {
          console.error('Failed to fetch user:', error)
        }
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration
        if (state) {
          state.setHasHydrated(true)
        }
      }
    }
  )
)
