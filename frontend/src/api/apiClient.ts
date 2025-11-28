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
    
    // Handle 401 Unauthorized - user not authenticated
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear auth state
      if (typeof window !== 'undefined') {
        // Import auth store dynamically to avoid circular dependencies
        import('@/store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout()
        })
        
        // Only redirect to login if current page requires authentication
        // For public pages (like home), just log out silently
        const currentPath = window.location.pathname
        if (requiresAuth(currentPath)) {
          window.location.href = '/login'
        }
        // Otherwise, just log out silently - user can continue browsing public pages
      }
    }
    
    // Handle 403 Forbidden - CSRF token issue or permission denied
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true
      
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
        // Check error message to determine if it's authentication or CSRF issue
        const errorData = error.response?.data as { detail?: string; message?: string } | undefined
        const errorDetail = errorData?.detail || errorData?.message || ''
        if (errorDetail.includes('Authentication') || 
            errorDetail.includes('credentials') ||
            errorDetail.includes('not authenticated')) {
          // Only redirect to login if current page requires authentication
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            if (requiresAuth(currentPath)) {
              window.location.href = '/login'
            }
            // Otherwise, just log out silently - user can continue browsing public pages
            import('@/store/authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().logout()
            })
          }
        } else {
          // For CSRF errors, show a user-friendly message
          console.error('CSRF token error. Please refresh the page and try again.')
        }
      }
    }
    
    return Promise.reject(error)
  }
)

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
  ]
  
  // Check if pathname starts with any auth-required path
  return authRequiredPaths.some(path => pathname.startsWith(path))
}

export default apiClient

