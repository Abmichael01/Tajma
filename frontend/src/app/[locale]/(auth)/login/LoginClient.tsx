"use client"

import React, { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { Checkbox } from '@/components/ui/checkbox'
import Logo from '@/components/General/Logo'
import { toast } from 'sonner'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const loginMutation = useLogin(redirectTo)

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLocal, setIsLocal] = useState(false)

  useEffect(() => {
    setIsLocal(
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.startsWith('192.168.')
    )
  }, [])

  // Check for auth_required parameter and show toast
  useEffect(() => {
    const authRequired = searchParams.get('auth_required')
    if (authRequired === 'true') {
      toast.info('Please login to continue', {
        duration: 5000,
      })
    }
  }, [searchParams])

  

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Clear previous errors
    setErrors({})

    try {
      await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      })
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data) {
        const apiErrors = error.response.data
        
        // Handle field-specific errors
        if (apiErrors.email) {
          setErrors(prev => ({ ...prev, email: Array.isArray(apiErrors.email) ? apiErrors.email[0] : apiErrors.email }))
        }
        if (apiErrors.password) {
          setErrors(prev => ({ ...prev, password: Array.isArray(apiErrors.password) ? apiErrors.password[0] : apiErrors.password }))
        }
        if (apiErrors.non_field_errors) {
          setErrors(prev => ({ ...prev, general: Array.isArray(apiErrors.non_field_errors) ? apiErrors.non_field_errors[0] : apiErrors.non_field_errors }))
        }
        // Handle general error message
        if (apiErrors.message && !apiErrors.email && !apiErrors.password && !apiErrors.non_field_errors) {
          setErrors(prev => ({ ...prev, general: apiErrors.message }))
        }
      } else {
        setErrors({ general: 'An error occurred. Please try again.' })
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="w-full flex flex-col justify-center py-12 px-6 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center lg:justify-start">
          <Logo />
        </div>
        <h2 className="mt-6 text-center lg:text-left text-3xl font-semibold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center lg:text-left text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-md">
        {/* Social Login - Moved to top */}
        <div className="mb-6">
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
                onClick={async () => {
                  try {
                    const redirectUri = `${window.location.origin}/auth/google/callback`
                    const { authorization_url } = await authApi.getGoogleAuthUrl(redirectUri)
                    window.location.href = authorization_url
                  } catch (error) {
                    console.error('Failed to initiate Google login:', error)
                    alert('Failed to initiate Google login. Please try again.')
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
              {isLocal && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-3 border-dashed border-primary text-primary hover:bg-primary/5"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      email: 'admin@gmail.com',
                      password: 'password123'
                    }))
                    toast.success('Admin credentials filled')
                  }}
                >
                  Auto-fill Admin (Dev Only)
                </Button>
              )}
            </div>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, rememberMe: checked === true }))
                  }}
                />
                <label htmlFor="rememberMe" className="block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="w-full min-w-0"
                disabled={loginMutation.isPending}
              >
                <span className="flex items-center justify-center min-w-0">
                  {loginMutation.isPending ? (
                    <>
                      <MarketplaceLoader inline size="sm" />
                      <span className="truncate ml-2">Signing in...</span>
                    </>
                  ) : (
                    <span className="truncate">Sign in</span>
                  )}
                </span>
              </Button>
            </div>
          </form>
      </div>
    </div>
  )
}

