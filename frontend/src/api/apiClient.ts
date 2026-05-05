import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// API base URL - adjust based on your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: "" + API_BASE_URL + "/api",
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add JWT Access Token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const { useAuthStore } = require('@/store/authStore')
      const token = useAuthStore.getState().accessToken

      if (token && config.headers) {
        config.headers.Authorization = "Bearer " + token
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/token/refresh')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      const { useAuthStore } = require('@/store/authStore')
      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post("" + API_BASE_URL + "/api/auth/token/refresh/", {
            refresh: refreshToken
          })
          const newAccessToken = refreshResponse.data.access
          const newRefreshToken = refreshResponse.data.refresh || refreshToken
          setTokens(newAccessToken, newRefreshToken)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = "Bearer " + newAccessToken
          }
          return apiClient(originalRequest)
        } catch (refreshError) {
          logout()
          return Promise.reject(refreshError)
        }
      } else {
        logout()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
