import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  
  // Actions
  login: (user: User, tokens?: { access: string; refresh: string }) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setTokens: (access: string, refresh: string) => void;
  setLoading: (loading: boolean) => void;
  completeSellerSetup: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: (userData, tokens) => {
        set((state) => ({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          ...(tokens && { accessToken: tokens.access, refreshToken: tokens.refresh })
        }));
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          });
        }
      },

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      completeSellerSetup: () => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, is_seller_account_setup: true }
          });
        }
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      }
    }),
    {
      name: 'auth-storage', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
