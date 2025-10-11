import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  uid: string // Unique identifier for profile URLs
  name: string
  email: string
  avatar?: string
  location?: string
  phone?: string
  isVerified: boolean
  joinedDate: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (user: Omit<User, 'id' | 'joinedDate'>) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

// Mock user data for simulation
const mockUser: User = {
  id: '1',
  uid: 'john_doe_123', // URL-friendly unique identifier
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  location: 'Lagos, Nigeria',
  phone: '+234 801 234 5678',
  isVerified: true,
  joinedDate: '2024-01-15'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (userData) => {
        set({ isLoading: true })
        
        // Simulate API call delay
        setTimeout(() => {
          const newUser: User = {
            ...userData,
            id: Date.now().toString(),
            uid: mockUser.uid, // In real app, this would come from server
            joinedDate: new Date().toISOString().split('T')[0]
          }
          
          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false
          })
        }, 1000)
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
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Helper function to simulate authentication
export const simulateAuth = () => {
  const { login } = useAuthStore.getState()
  login({
    uid: mockUser.uid,
    name: mockUser.name,
    email: mockUser.email,
    avatar: mockUser.avatar,
    location: mockUser.location,
    phone: mockUser.phone,
    isVerified: mockUser.isVerified
  })
}
