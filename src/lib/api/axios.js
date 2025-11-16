/**
 * Axios Instance with Interceptors
 * Global API client with request/response interceptors
 */

import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      })
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error) => {
    // Handle errors globally
    const { response, request, message } = error

    if (response) {
      // Server responded with error status
      const { status, data } = response

      switch (status) {
        case 400:
          toast.error(data.error || 'Bad request')
          break

        case 401:
          toast.error('Unauthorized. Please login again.')
          // Clear auth and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            window.location.href = '/login'
          }
          break

        case 403:
          toast.error('Access forbidden')
          break

        case 404:
          toast.error(data.error || 'Resource not found')
          break

        case 422:
          // Validation errors
          if (data.details) {
            data.details.forEach((err) => {
              toast.error(`${err.path}: ${err.message}`)
            })
          } else {
            toast.error(data.error || 'Validation failed')
          }
          break

        case 500:
          toast.error('Server error. Please try again later.')
          break

        case 503:
          toast.error('Service unavailable. Please try again later.')
          break

        default:
          toast.error(data.error || 'An error occurred')
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API Error Response:', {
          url: response.config.url,
          status,
          data,
        })
      }
    } else if (request) {
      // Request made but no response received
      toast.error('Network error. Please check your connection.')
      console.error('❌ Network Error:', message)
    } else {
      // Something else happened
      toast.error('Request failed. Please try again.')
      console.error('❌ Error:', message)
    }

    return Promise.reject(error)
  }
)

// Helper functions for common HTTP methods
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
}

export default apiClient
