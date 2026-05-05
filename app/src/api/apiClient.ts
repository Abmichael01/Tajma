import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import i18n from '../i18n';

// API base URL - adjust based on your backend
// Set EXPO_PUBLIC_API_URL in .env file
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // Remove withCredentials since we are using JWT tokens now, not cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add JWT Access Token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get Access token directly from Zustand store
    const token = useAuthStore.getState().accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set Accept-Language header based on current i18n language
    if (config.headers) {
      config.headers['Accept-Language'] = i18n.language || 'en';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally & Auto-refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log network errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Network Error:', error.message, 'URL:', originalRequest?.url);
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText, 'URL:', originalRequest?.url);
    }

    // Check if error is 401 Unauthorized (token expired) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if the original request was to login or refresh endpoint
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/token/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          console.log('Attempting to refresh JWT token...');
          // Make request to refresh token endpoint
          // (Adjust URL if your Django backend uses a different endpoint for SimpleJWT)
          const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });

          const newAccessToken = refreshResponse.data.access;
          // Some backends also return a new refresh token, grab it if it exists
          const newRefreshToken = refreshResponse.data.refresh || refreshToken;

          // Update tokens in Zustand
          setTokens(newAccessToken, newRefreshToken);

          // Update Authorization header for the retried request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Retry the original request with the new token
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.warn('Failed to refresh token, logging out...');
          logout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        console.warn('No refresh token available on 401, logging out...');
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
