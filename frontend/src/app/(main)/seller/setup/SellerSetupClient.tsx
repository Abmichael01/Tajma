"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useCSRFToken } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useRegions } from '@/hooks/useRegions'
import { Phone, MapPin, Check, Building2, Globe, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

const businessTypes = [
  { value: 'individual', label: 'Individual Seller' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'service', label: 'Service Provider' },
  { value: 'other', label: 'Other' }
]

export default function SellerSetupClient() {
  const router = useRouter()
  const { user, completeSellerSetup, isAuthenticated } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const { data: csrfData } = useCSRFToken()

  const { data: regions, isLoading: regionsLoading } = useRegions()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [isLoading, setIsLoading] = useState(true)

  // Get region ID from user location by matching region name
  const getUserRegionId = () => {
    if (!user?.location || !regions) return ''
    const matchingRegion = regions.find(r => r.name === user.location)
    return matchingRegion?.id.toString() || ''
  }

  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    region: '',
    city: '',
    address: '',
    businessName: user?.business_name || '',
    businessType: user?.business_type || '',
    website: user?.website || '',
    bio: user?.bio || ''
  })

  // Update region when regions are loaded
  useEffect(() => {
    if (regions && user?.location && !formData.region) {
      const regionId = getUserRegionId()
      if (regionId) {
        setFormData(prev => ({ ...prev, region: regionId }))
      }
    }
  }, [regions, user?.location])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Check authentication and ensure CSRF token is loaded
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('You need to be logged in to set up your seller profile')
      router.push('/login?redirect=/seller/setup')
      return
    }

    // Wait for CSRF token to be available
    if (csrfData) {
      setIsLoading(false)
    }
  }, [isAuthenticated, csrfData, router])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MarketplaceLoader size="md" message="Loading..." />
      </div>
    )
  }

  const validateContactInfo = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid'
    }

    if (!formData.region) {
      newErrors.region = 'Region is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRegionChange = (value: string) => {
    setFormData(prev => ({ ...prev, region: value }))
    if (errors.region) {
      setErrors(prev => ({ ...prev, region: '' }))
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateContactInfo()) {
        return
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (currentStep !== totalSteps) {
      handleNext()
      return
    }

    if (!validateContactInfo()) {
      setCurrentStep(1)
      return
    }

    // Ensure user is authenticated before submitting
    if (!isAuthenticated || !user) {
      toast.error('Your session has expired. Please log in again.')
      router.push('/login?redirect=/seller/setup')
      return
    }

    // Ensure CSRF token is available
    if (!csrfData) {
      toast.error('Please wait for the page to fully load before submitting.')
      return
    }

    setGeneralError(null)

    try {
      // Update profile with seller information
      await updateProfile.mutateAsync({
        phone: formData.phone,
        location: formData.region ? parseInt(formData.region) : undefined,
        address: formData.address || undefined,
        business_name: formData.businessName || undefined,
        business_type: formData.businessType || undefined,
        website: formData.website || undefined,
        bio: formData.bio || undefined,
      })

      // Mark seller setup as complete
      completeSellerSetup()

      // Redirect to profile
      toast.success('Seller profile completed successfully!')
      router.push('/profile')
    } catch (error: any) {
      console.error('Seller setup error:', error)
      
      // Handle 403 Forbidden - authentication or permission issue
      if (error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message || ''
        if (errorDetail.includes('Authentication') || errorDetail.includes('not authenticated')) {
          toast.error('Your session has expired. Please log in again.')
          router.push('/login?redirect=/seller/setup')
          return
        } else {
          toast.error('You do not have permission to perform this action. Please try refreshing the page.')
          return
        }
      }
      
      const apiErrors = error.response?.data || {}
      const errors: Record<string, string> = {}
      
      Object.keys(apiErrors).forEach(key => {
        if (key !== 'detail' && key !== 'message') {
          if (Array.isArray(apiErrors[key])) {
            errors[key] = apiErrors[key][0]
          } else {
            errors[key] = apiErrors[key]
          }
        }
      })
      
      if (Object.keys(errors).length > 0) {
        setErrors(errors)
        // Show first error as toast
        const firstError = Object.values(errors)[0]
        if (firstError) {
          toast.error(firstError)
        }
      } else {
        const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to complete setup. Please try again.'
        setGeneralError(message)
        toast.error(message)
      }
    }
  }

  const renderContactStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <p className="text-sm text-gray-600 mt-1">Buyers will use this information to reach you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+234 801 234 5678"
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            Region <span className="text-red-500">*</span>
          </label>
          {regionsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Loading regions...</span>
            </div>
          ) : (
            <Select value={formData.region} onValueChange={handleRegionChange}>
              <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                {regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City / Area <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleInputChange}
              className={`pl-10 ${errors.city ? 'border-red-500' : ''}`}
              placeholder="e.g., Ikeja, Surulere"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Street Address <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
              placeholder="e.g., 123 Main Street"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
      </div>
    </div>
  )

  const renderBusinessStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
        <p className="text-sm text-gray-600 mt-1">Tell potential buyers more about your store. These fields are optional but recommended.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
            Business Name
          </label>
          <div className="mt-1 relative">
            <Input
              id="businessName"
              name="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="Your business name"
            />
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
            Business Type
          </label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website (Optional)
        </label>
        <div className="mt-1 relative">
          <Input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleInputChange}
            className="pl-10"
            placeholder="https://yourstore.com"
          />
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          About Your Business (Optional)
        </label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows={5}
          className="mt-1"
          placeholder="Share what makes your business unique, your experience, and what buyers can expect..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/500</p>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Review & Confirm</h3>
        <p className="text-sm text-gray-600 mt-1">Double-check your details before finishing setup.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50/50">
            <h4 className="text-sm font-semibold text-gray-900">Contact Information</h4>
          </div>
          <div className="divide-y divide-gray-200 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Phone</dt>
              <dd className="text-gray-900 font-medium">{formData.phone || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Region</dt>
              <dd className="text-gray-900 font-medium capitalize">
                {formData.region ? regions?.find(r => r.id.toString() === formData.region)?.name || '—' : '—'}
              </dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">City / Area</dt>
              <dd className="text-gray-900 font-medium capitalize">{formData.city || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Street Address</dt>
              <dd className="text-gray-900 font-medium">{formData.address || '—'}</dd>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50/50">
            <h4 className="text-sm font-semibold text-gray-900">Business Information</h4>
          </div>
          <div className="divide-y divide-gray-200 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Business Name</dt>
              <dd className="text-gray-900 font-medium">{formData.businessName || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Business Type</dt>
              <dd className="text-gray-900 font-medium">{businessTypes.find(type => type.value === formData.businessType)?.label || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Website</dt>
              <dd className="text-gray-900 font-medium break-all">{formData.website || '—'}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="font-medium text-gray-600 mb-1">About Your Business</dt>
              <dd className="text-gray-900 whitespace-pre-line">{formData.bio || '—'}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>You can always update these details later from your profile.</span>
      </div>
    </div>
  )

  const steps = [
    { num: 1, label: 'Contact Info', desc: 'Phone & location details' },
    { num: 2, label: 'Business Info', desc: 'Tell buyers about your store' },
    { num: 3, label: 'Review', desc: 'Confirm everything looks good' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-3xl font-semibold text-gray-900">
          Complete Your Seller Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about your business so we can help you connect with the right buyers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow border border-gray-200 sm:px-10 rounded-lg overflow-hidden">
          <ProgressStepper currentStep={currentStep} steps={steps} showMeta={false} />

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
              <p className="text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && renderContactStep()}
            {currentStep === 2 && renderBusinessStep()}
            {currentStep === 3 && renderReviewStep()}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="sm:flex-1 min-w-0"
                >
                  <span className="flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </span>
                </Button>
              )}

              {currentStep < totalSteps && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="sm:flex-1 min-w-0"
                >
                  <span className="flex items-center justify-center">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              )}

              {currentStep === totalSteps && (
                <Button
                  type="submit"
                  className="sm:flex-1 min-w-0"
                  disabled={updateProfile.isPending}
                >
                  <span className="flex items-center justify-center min-w-0">
                    {updateProfile.isPending ? (
                      <>
                        <MarketplaceLoader inline size="sm" white />
                        <span className="truncate ml-2">Finishing setup...</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">Complete Setup</span>
                        <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
                      </>
                    )}
                  </span>
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
