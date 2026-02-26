import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';

// API base URL - adjust based on your backend
// For development, use your local IP or ngrok URL
// For production, use your production API URL
// Set EXPO_PUBLIC_API_URL in .env file
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8007';

const CSRF_TOKEN_KEY = '@csrf_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add CSRF token to requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get CSRF token from AsyncStorage
      const csrfToken = await AsyncStorage.getItem(CSRF_TOKEN_KEY);

      if (csrfToken && config.headers) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    } catch (error) {
      // Silently fail - CSRF token might not be set yet
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log only actual errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Network Error:', error.message, 'URL:', originalRequest?.url);
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText, 'URL:', originalRequest?.url);
    }

    // Handle 401 Unauthorized - Session expired or invalid
    if (error.response?.status === 401) {
      console.warn('Authentication expired (401), logging out...');
      const { logout } = useAuthStore.getState();
      logout();
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - CSRF token issue OR authentication credentials not provided
    if (error.response?.status === 403) {
      if (!originalRequest._retry) {
        // If it's a 403 on a GET request, it's not a CSRF issue, it's an Auth issue
        if (originalRequest.method?.toUpperCase() === 'GET') {
          console.warn('Forbidden on GET (403), logging out...');
          const { logout } = useAuthStore.getState();
          logout();
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Try to get a new CSRF token and retry the request
        try {
          console.log('Attempting CSRF refresh on 403...');
          const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
            method: 'GET',
            credentials: 'include',
          });

          if (!csrfResponse.ok) {
            throw new Error('Failed to fetch CSRF token');
          }

          const csrfData = await csrfResponse.json();
          const csrfToken = csrfData.csrfToken;

          if (!csrfToken) {
            console.warn('No CSRF token returned, logging out...');
            const { logout } = useAuthStore.getState();
            logout();
            return Promise.reject(error);
          }

          // Store CSRF token in AsyncStorage
          await AsyncStorage.setItem(CSRF_TOKEN_KEY, csrfToken);

          // Update the CSRF token in the original request and headers
          if (originalRequest.headers) {
            originalRequest.headers['X-CSRFToken'] = csrfToken;
          }

          // Retry the original request
          return apiClient(originalRequest);
        } catch (csrfError) {
          console.error('CSRF token error during retry:', csrfError);
          const { logout } = useAuthStore.getState();
          logout();
          return Promise.reject(error);
        }
      } else {
        // Retry already attempted and still getting 403
        console.warn('Persistent 403 after retry, logging out...');
        const { logout } = useAuthStore.getState();
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
