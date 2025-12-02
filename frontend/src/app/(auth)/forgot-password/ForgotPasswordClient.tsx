"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import Logo from '@/components/General/Logo'

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail()) return

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
    }, 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  if (isSuccess) {
    return (
      <div className="w-full flex flex-col justify-center py-12 px-6 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center lg:justify-start">
            <Logo />
          </div>
          
          <div className="mt-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Check your email
              </h2>
              
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to:
              </p>
              
              <p className="font-medium text-gray-900 mb-6">
                {email}
              </p>
              
              <p className="text-sm text-gray-600 mb-8">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
                
                <button
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail('')
                  }}
                  className="w-full text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col justify-center py-12 px-6 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center lg:justify-start">
          <Logo />
        </div>
        <h2 className="mt-6 text-center lg:text-left text-3xl font-semibold text-gray-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center lg:text-left text-sm text-gray-600">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-md">
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
                  value={email}
                  onChange={handleInputChange}
                  className={`pl-10 ${error ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="w-full min-w-0"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center min-w-0">
                  {isLoading ? (
                    <>
                      <MarketplaceLoader inline size="sm" />
                      <span className="truncate">Sending...</span>
                    </>
                  ) : (
                    <span className="truncate">Send reset instructions</span>
                  )}
                </span>
              </Button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-6">
            <Link
              href="/login"
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
      </div>
    </div>
  )
}

