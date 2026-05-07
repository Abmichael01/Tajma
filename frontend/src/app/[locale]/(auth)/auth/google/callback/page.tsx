'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { useGoogleLogin } from '@/hooks/useAuth'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const googleLogin = useGoogleLogin()
  const [error, setError] = useState<string | null>(null)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Prevent multiple calls
    if (hasProcessed.current) return
    
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      hasProcessed.current = true
      setError(`Google authentication error: ${errorParam}`)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      return
    }

    if (!code) {
      hasProcessed.current = true
      setError('No authorization code received from Google.')
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      return
    }

    // Mark as processed to prevent duplicate calls
    hasProcessed.current = true

    // Use the actual pathname so the locale prefix is included
    // (e.g. https://tajma.net/en/auth/google/callback) — must match the
    // redirect_uri used when the authorization URL was built.
    const redirectUri = `${window.location.origin}${window.location.pathname}`

    // Call the backend to exchange code for user info
    googleLogin.mutate(
      { code, redirectUri },
      {
        onError: (err: any) => {
          const errorMessage = err.response?.data?.error || err.message || 'Failed to authenticate with Google.'
          console.error('Google login error details:', {
            error: err,
            response: err.response?.data,
            status: err.response?.status,
          })
          setError(errorMessage)
          setTimeout(() => {
            router.push('/login')
          }, 5000)
        },
      }
    )
  }, [searchParams, router, googleLogin])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <p className="text-red-600 mb-2 font-medium">{error}</p>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <MarketplaceLoader 
          message="Wait while we set up your account..."
          size="lg"
        />
      </div>
    </div>
  )
}

