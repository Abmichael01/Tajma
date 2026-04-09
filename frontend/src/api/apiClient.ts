import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// API base URL - adjust based on your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Important for session-based auth
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add CSRF token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get CSRF token from cookie
    const csrfToken = getCookie('csrftoken')
    
    if (csrfToken && config.headers) {
      config.headers['X-CSRFToken'] = csrfToken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    
    // Check if it's an authentication error (401 or certain 403s)
    const isAuthErr = isAuthError(error)
    
    // Handle 401 Unauthorized - user not authenticated
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Don't logout on 401 from getCurrentUser - let useCurrentUser hook handle it
      // This prevents double-logout and race conditions
      if (originalRequest.url?.includes('/auth/user/')) {
        return Promise.reject(error)
      }
      
      if (isAuthErr) {
        handleLogout()
      }
    }
    
    // Handle 403 Forbidden - CSRF token issue or permission denied
    if (status === 403 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // If it's a "not authenticated" error returned as 403, log out immediately
      if (isAuthErr) {
        handleLogout()
        return Promise.reject(error)
      }
      
      // Try to get a new CSRF token and retry the request
      try {
        // Fetch CSRF token - this will set the cookie via ensure_csrf_cookie
        const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (!csrfResponse.ok) {
          throw new Error('Failed to fetch CSRF token')
        }
        
        const csrfData = await csrfResponse.json()
        
        // Wait a bit for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Get CSRF token from cookie (should be set by ensure_csrf_cookie)
        const csrfToken = getCookie('csrftoken') || csrfData.csrfToken
        
        // Update the CSRF token in the original request
        if (csrfToken && originalRequest.headers) {
          originalRequest.headers['X-CSRFToken'] = csrfToken
        }
        
        // Retry the original request
        return apiClient(originalRequest)
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError)
        
        // For CSRF errors that turned out to be auth errors after all
        if (isAuthError(error)) {
           handleLogout()
        } else {
          // For true CSRF errors, show a user-friendly message
          console.error('CSRF token error. Please refresh the page and try again.')
        }
      }
    }
    
    // Fallback for second attempt failures or other status codes
    if (isAuthErr && originalRequest._retry) {
      handleLogout()
    }
    
    return Promise.reject(error)
  }
)

// Helper function to detect authentication errors
function isAuthError(error: AxiosError): boolean {
  const status = error.response?.status
  if (status !== 401 && status !== 403) return false
  
  // Check if it's a real auth error (not a network timeout or connection error)
  const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK'
  if (isNetworkError) return false
  
  const errorData = error.response?.data as { detail?: string; message?: string } | undefined
  const errorDetail = errorData?.detail || errorData?.message || ''
  
  // DRF often returns "Authentication credentials were not provided." or similar
  return (
    errorDetail.toLowerCase().includes('authentication') || 
    errorDetail.toLowerCase().includes('credentials') ||
    errorDetail.toLowerCase().includes('not authenticated') ||
    errorDetail.toLowerCase().includes('unauthorized') ||
    (status === 401 && errorDetail === '') // Empty detail suele ser sesión expirada
  )
}

// Helper function to handle global logout
function handleLogout() {
  if (typeof window === 'undefined') return
  
  // Import auth store dynamically to avoid circular dependencies
  import('@/store/authStore').then(({ useAuthStore }) => {
    const authState = useAuthStore.getState()
    
    // Only logout if user is actually authenticated in store or we need to ensure it's cleared
    if (authState.isAuthenticated) {
      console.log('Authentication error detected, logging out...')
      authState.logout()
      
      const currentPath = window.location.pathname
      // Only redirect if we're on a protected page
      if (requiresAuth(currentPath) && currentPath !== '/login') {
        window.location.href = '/login'
      }
    }
  })
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

// Helper function to check if current page requires authentication
function requiresAuth(pathname: string): boolean {
  const authRequiredPaths = [
    '/create-ad',
    '/profile',
    '/alerts',
    '/chat',
    '/admin',
  ]
  
  // Check if pathname starts with any auth-required path
  return authRequiredPaths.some(path => pathname.startsWith(path))
}

export default apiClient
