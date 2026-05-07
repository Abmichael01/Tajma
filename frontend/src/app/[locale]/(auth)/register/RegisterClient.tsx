"use client"

import React, { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegister } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { Eye, EyeOff, Mail, Lock, User, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { Checkbox } from '@/components/ui/checkbox'
import Logo from '@/components/General/Logo'

export default function RegisterClient() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const registerMutation = useRegister()

  const [signupMethod, setSignupMethod] = useState<'google' | 'email' | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.first_name_required')
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = t('validation.first_name_min')
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.last_name_required')
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = t('validation.last_name_min')
    }

    if (!formData.username.trim()) {
      newErrors.username = t('validation.username_required')
    } else if (formData.username.length < 3) {
      newErrors.username = t('validation.username_min')
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('validation.username_chars')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = t('validation.email_required')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid')
    }

    if (!formData.password) {
      newErrors.password = t('validation.password_required')
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.password_min_8')
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('validation.password_strength')
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirm_password_required')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwords_dont_match')
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t('validation.agree_terms_required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupMethodSelect = async (method: 'google' | 'email') => {
    setSignupMethod(method)
    if (method === 'google') {
      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`
        const { authorization_url } = await authApi.getGoogleAuthUrl(redirectUri)
        window.location.href = authorization_url
      } catch (error) {
        console.error('Failed to initiate Google signup:', error)
        alert(t('google_signup_failed'))
      }
    }
    // If email, currentStep stays at 1 and form shows
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handlePrevious = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 1 && signupMethod === 'email') {
      setSignupMethod(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentStep === 1) {
      handleNext()
      return
    }

    if (!validateStep2()) return

    // Clear previous errors
    setErrors({})

    try {
      await registerMutation.mutateAsync({
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
         last_name: formData.lastName,
         password: formData.password,
         password_confirm: formData.confirmPassword,
         preferred_language: locale as 'en' | 'fr' | 'ha',
       })
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data) {
        const apiErrors = error.response.data
        
        // Handle field-specific errors
        if (apiErrors.email) {
          setErrors(prev => ({ ...prev, email: Array.isArray(apiErrors.email) ? apiErrors.email[0] : apiErrors.email }))
        }
        if (apiErrors.username) {
          setErrors(prev => ({ ...prev, username: Array.isArray(apiErrors.username) ? apiErrors.username[0] : apiErrors.username }))
        }
        if (apiErrors.first_name) {
          setErrors(prev => ({ ...prev, firstName: Array.isArray(apiErrors.first_name) ? apiErrors.first_name[0] : apiErrors.first_name }))
        }
        if (apiErrors.last_name) {
          setErrors(prev => ({ ...prev, lastName: Array.isArray(apiErrors.last_name) ? apiErrors.last_name[0] : apiErrors.last_name }))
        }
        if (apiErrors.password) {
          setErrors(prev => ({ ...prev, password: Array.isArray(apiErrors.password) ? apiErrors.password[0] : apiErrors.password }))
        }
        if (apiErrors.password_confirm) {
          setErrors(prev => ({ ...prev, confirmPassword: Array.isArray(apiErrors.password_confirm) ? apiErrors.password_confirm[0] : apiErrors.password_confirm }))
        }
        if (apiErrors.non_field_errors) {
          setErrors(prev => ({ ...prev, general: Array.isArray(apiErrors.non_field_errors) ? apiErrors.non_field_errors[0] : apiErrors.non_field_errors }))
        }
        // Handle general error message
        if (apiErrors.message && !apiErrors.email && !apiErrors.username && !apiErrors.password && !apiErrors.non_field_errors) {
          setErrors(prev => ({ ...prev, general: apiErrors.message }))
        }
      } else {
        setErrors({ general: t('general_error') })
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

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    const labels = ['', t('strength_weak'), t('strength_fair'), t('strength_good'), t('strength_strong')]
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
    
    return { strength, label: labels[Math.min(strength, 4)], color: colors[Math.min(strength, 4)] }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="w-full flex flex-col justify-center py-12 px-6 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center lg:justify-start">
          <Logo />
        </div>
        <h2 className="mt-6 text-center lg:text-left text-3xl font-semibold text-gray-900">
          {t('create_account')}
        </h2>
        <p className="mt-2 text-center lg:text-left text-sm text-gray-600">
          {t('have_account')}{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            {t('sign_in')}
          </Link>
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-md">
        {/* Signup Method Selection */}
          {!signupMethod && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('choose_signup_method')}</h3>
                <p className="text-sm text-gray-600">{t('select_method_subtitle')}</p>
              </div>
              
              <Button
                type="button"
                className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white"
                onClick={() => handleSignupMethodSelect('google')}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                {t('continue_with_google')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('or')}</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-14"
                onClick={() => handleSignupMethodSelect('email')}
              >
                <Mail className="w-5 h-5 mr-3" />
                {t('continue_with_email')}
              </Button>
            </div>
          )}

          {/* Registration Form - Only show if email method selected */}
          {signupMethod === 'email' && (
            <>
              {/* Progress Indicator */}
              <div className="mb-8" aria-label={t('step_progress', { step: currentStep })}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                      currentStep >= 1
                        ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {currentStep > 1 ? <Check className="w-5 h-5" strokeWidth={3} /> : '1'}
                  </div>
                  <div className="flex-1 h-1 mx-3 bg-gray-100 rounded-full relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: currentStep > 1 ? '100%' : '0%' }}
                    />
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                      currentStep === 2
                        ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    2
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs">
                  <span
                    className={`transition-colors duration-300 ${
                      currentStep === 1 ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'
                    }`}
                  >
                    {t('step_basic_info')}
                  </span>
                  <span
                    className={`transition-colors duration-300 ${
                      currentStep === 2 ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'
                    }`}
                  >
                    {t('step_account_details')}
                  </span>
                </div>
              </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    {t('first_name_label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`pl-10 h-11 ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="John"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

            <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    {t('last_name_label')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <Input
                      id="lastName"
                      name="lastName"
                  type="text"
                      autoComplete="family-name"
                      value={formData.lastName}
                  onChange={handleInputChange}
                      className={`pl-10 h-11 ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Doe"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    {t('username_label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`pl-10 h-11 ${errors.username ? 'border-red-500' : ''}`}
                      placeholder="johndoe"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{t('username_helper')}</p>
                </div>
              </>
            )}

            {/* Step 2: Account Details */}
            {currentStep === 2 && (
              <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('email_label')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('password_label')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`pl-10 pr-10 h-11 ${errors.password ? 'border-red-500' : ''}`}
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
              {formData.password && passwordStrength.strength > 0 && (
                    <div className="mt-2 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-1 h-1.5 bg-gray-200 min-w-0 overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      />
                    </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    {t('confirm_password_label')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {t('passwords_match')}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ ...prev, agreeToTerms: checked === true }))
                        if (errors.agreeToTerms) {
                          setErrors(prev => ({ ...prev, agreeToTerms: '' }))
                        }
                      }}
                      className={errors.agreeToTerms ? 'border-red-500' : ''}
                    />
                    <label htmlFor="agreeToTerms" className="block text-sm text-gray-700 cursor-pointer">
                  {t('agree_to')}{' '}
                  <Link href="/terms" className="font-medium text-primary hover:text-primary/80">
                    {t('terms_conditions')}
                  </Link>{' '}
                  {t('and')}{' '}
                  <Link href="/privacy" className="font-medium text-primary hover:text-primary/80">
                    {t('privacy_policy')}
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
              )}
            </div>
              </>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">{errors.general}</p>
              </div>
            )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-2">
                  {currentStep === 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={handlePrevious}
                      className="flex-1 min-w-0"
                    >
                      <span className="flex items-center min-w-0">
                        <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('back')}</span>
                      </span>
                    </Button>
                  )}
                  {currentStep === 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={handlePrevious}
                      className="flex-1 min-w-0"
                    >
                      <span className="flex items-center min-w-0">
                        <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('previous')}</span>
                      </span>
                    </Button>
                  )}
              <Button
                type="submit"
                size="lg"
                    className="flex-1 min-w-0"
                disabled={registerMutation.isPending}
              >
                    <span className="flex items-center justify-center min-w-0">
                          {registerMutation.isPending ? (
                            <>
                              <MarketplaceLoader inline size="sm" />
                              <span className="truncate ml-2">{currentStep === 2 ? t('creating') : t('loading')}</span>
                            </>
                          ) : currentStep === 1 ? (
                        <>
                          <span className="truncate">{t('next')}</span>
                          <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                  </>
                ) : (
                        <span className="truncate">{t('create_account_button')}</span>
                )}
                    </span>
              </Button>
            </div>
          </form>
            </>
          )}
      </div>
    </div>
  )
}
