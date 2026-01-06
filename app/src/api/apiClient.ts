import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - adjust based on your backend
// For development, use your local IP or ngrok URL
// For production, use your production API URL
// Set EXPO_PUBLIC_API_URL in .env file
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const CSRF_TOKEN_KEY = '@csrf_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Important for cookie-based auth - axios handles cookies automatically
  headers: {
    'Content-Type': 'application/json',
    'Referer': API_BASE_URL, // Add Referer header for Django CSRF protection
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth state and redirect to login
      // This will be handled by the auth store
    }
    
    // Handle 403 Forbidden - CSRF token issue
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to get a new CSRF token and retry the request
      try {
        // Fetch CSRF token - this will set the cookie via ensure_csrf_cookie
        const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!csrfResponse.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;
        
        // Store CSRF token in AsyncStorage
        if (csrfToken) {
          await AsyncStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
        }
        
        // Update the CSRF token in the original request
        if (csrfToken && originalRequest.headers) {
          originalRequest.headers['X-CSRFToken'] = csrfToken;
        }
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (csrfError) {
        console.error('CSRF token error:', csrfError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

