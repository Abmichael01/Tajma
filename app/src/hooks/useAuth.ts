import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useChatWebSocketStore } from '@/store/chatWebSocketStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import type { LoginRequest, RegisterRequest, PasswordChangeRequest, ProfileUpdateRequest } from '@/api/types';
import { AxiosError } from 'axios';

// Login hook
export const useLogin = (redirectTo: string = '/home') => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Pass tokens to auth store if they exist
      const tokens = response.access && response.refresh 
        ? { access: response.access, refresh: response.refresh } 
        : undefined;
        
      setAuthUser(response.user, tokens);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Navigate to specified path or home tab instantly
      router.replace(redirectTo as any);
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      throw error;
    },
  });
};

// Register hook
export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      const tokens = response.access && response.refresh 
        ? { access: response.access, refresh: response.refresh } 
        : undefined;
        
      setAuthUser(response.user, tokens);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Navigate to home
      router.replace('/(tabs)' as any);
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      throw error;
    },
  });
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout: clearAuthUser } = useAuthStore();
  const disconnectChat = useChatWebSocketStore((state) => state.disconnect);
  const clearNotifications = useNotificationsStore((state) => state.clearAll);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Disconnect and clear chat WS
      disconnectChat();

      // Clear notifications
      clearNotifications();

      // Clear user from store
      clearAuthUser();

      // Clear all queries
      queryClient.clear();

      // Navigate to login
      router.replace('/(auth)/login' as any);
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      disconnectChat();
      clearNotifications();
      clearAuthUser();
      queryClient.clear();
      router.replace('/(auth)/login' as any);
    },
  });
};

// Get current user hook
export const useCurrentUser = () => {
  const { isAuthenticated, user, hasHydrated, login: setAuthUser, logout: clearAuthUser } = useAuthStore();

  // Enable query if authenticated OR if there's a persisted user (to handle hydration)
  // This allows fetching user data even during the hydration period
  // Only fetch if store has hydrated to avoid premature fetches
  const shouldFetch = hasHydrated && (isAuthenticated || user !== null);

  const query = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: shouldFetch, // Fetch if authenticated or if we have persisted user data
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 401/403
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          return false; // Don't retry auth errors
        }
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setAuthUser(query.data);
    }
  }, [query.data, setAuthUser]);

  useEffect(() => {
    // Only logout on authentication errors (401, 403), not on all errors
    if (query.error) {
      const error = query.error as AxiosError;
      const status = error.response?.status;

      // Only clear auth on authentication/authorization errors AND if user is actually authenticated
      // This prevents logging out on temporary network issues or when user is already logged out
      if ((status === 401 || status === 403) && isAuthenticated && user) {
        // Check if it's a real auth error (not a network timeout or connection error)
        const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

        if (!isNetworkError) {
          console.log('Authentication error detected, logging out:', status);
          clearAuthUser();
        } else {
          // Network error - don't logout, just log
          console.warn('Network error fetching user, keeping auth state:', error.message);
        }
      } else if (status === 401 || status === 403) {
        // Auth error but user not authenticated in store - just clear silently
        // This handles the case where persisted state is stale
        if (user) {
          console.log('Stale auth state detected, clearing:', status);
          clearAuthUser();
        }
      } else {
        // For other errors (network, 500, etc.), just log but don't logout
        console.warn('Error fetching current user (non-auth):', error.message);
      }
    }
  }, [query.error, clearAuthUser, isAuthenticated, user]);

  return query;
};

// Change password hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => authApi.changePassword(data),
    onError: (error: any) => {
      console.error('Password change error:', error);
      throw error;
    },
  });
};

// Google OAuth hook
export const useGoogleLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ code, redirectUri }: { code: string; redirectUri: string }) =>
      authApi.googleCallback(code, redirectUri),
    onSuccess: (response) => {
      setAuthUser(response.user);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Navigate to home
      router.replace('/(tabs)' as any);
    },
    onError: (error: any) => {
      console.error('Google login error:', error);
      throw error;
    },
  });
};

// Update profile hook
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => authApi.updateProfile(data),
    onSuccess: (response) => {
      setAuthUser(response.user);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      throw error;
    },
  });
};

