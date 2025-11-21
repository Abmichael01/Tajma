import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, RegisterRequest, PasswordChangeRequest, ProfileUpdateRequest } from '@/api/types'

// Get CSRF token hook
export const useCSRFToken = () => {
  return useQuery({
    queryKey: ['csrf-token'],
    queryFn: () => authApi.getCSRFToken(),
    staleTime: Infinity, // CSRF token doesn't change often
    retry: false,
  })
}

// Login hook
export const useLogin = (redirectTo: string = '/') => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { login: setAuthUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuthUser(response.user)
      
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] })
      
      // Redirect to specified path or home
      router.push(redirectTo)
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      throw error
    },
  })
}

// Register hook
export const useRegister = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { login: setAuthUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      setAuthUser(response.user)
      
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] })
      
      // Redirect to home
      router.push('/')
    },
    onError: (error: any) => {
      console.error('Registration error:', error)
      throw error
    },
  })
}

// Logout hook
export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { logout: clearAuthUser } = useAuthStore()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear user from store
      clearAuthUser()
      
      // Clear all queries
      queryClient.clear()
      
      // Redirect to login
      router.push('/login')
    },
    onError: (error: any) => {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      clearAuthUser()
      queryClient.clear()
      router.push('/login')
    },
  })
}

// Get current user hook
export const useCurrentUser = () => {
  const { isAuthenticated, login: setAuthUser, logout: clearAuthUser } = useAuthStore()

  const query = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (query.data) {
      setAuthUser(query.data)
    }
  }, [query.data, setAuthUser])

  useEffect(() => {
    if (query.error) {
      clearAuthUser()
    }
  }, [query.error, clearAuthUser])

  return query
}

// Change password hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => authApi.changePassword(data),
    onError: (error: any) => {
      console.error('Password change error:', error)
      throw error
    },
  })
}

// Google OAuth hook
export const useGoogleLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { login: setAuthUser } = useAuthStore()

  return useMutation({
    mutationFn: ({ code, redirectUri }: { code: string; redirectUri: string }) =>
      authApi.googleCallback(code, redirectUri),
    onSuccess: (response) => {
      setAuthUser(response.user)
      
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] })
      
      // Redirect to home
      router.push('/')
    },
    onError: (error: any) => {
      console.error('Google login error:', error)
      throw error
    },
  })
}

// Update profile hook
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { login: setAuthUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => authApi.updateProfile(data),
    onSuccess: (response) => {
      setAuthUser(response.user)
      
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: any) => {
      console.error('Profile update error:', error)
      throw error
    },
  })
}

