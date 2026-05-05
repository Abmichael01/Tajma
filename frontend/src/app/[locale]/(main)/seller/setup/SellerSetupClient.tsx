"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import { useAuthStore } from '@/store/authStore'
import { useRegions } from '@/hooks/useRegions'
import { useUpdateProfile, useCSRFToken } from '@/hooks/useAuth'
import { toast } from 'sonner'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

import SetupHeader from './components/SetupHeader'
import ContactStep from './components/ContactStep'
import BusinessStep from './components/BusinessStep'
import ReviewStep from './components/ReviewStep'
import SetupNavigation from './components/SetupNavigation'

export default function SellerSetupClient() {
  const router = useRouter()
  const { user, completeSellerSetup, isAuthenticated } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const { data: csrfData } = useCSRFToken()
  const { data: regions } = useRegions()

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    locationId: '',
    address: user?.address || '',
    businessName: user?.business_name || '',
    businessType: user?.business_type || '',
    website: user?.website || '',
    bio: user?.bio || ''
  })
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    if (regions?.results && user?.location && !formData.locationId) {
      const matchingRegion = regions.results.find((r: any) => r.name === user.location)
      if (matchingRegion) setFormData(prev => ({ ...prev, locationId: matchingRegion.id.toString() }))
    }
  }, [regions, user?.location])

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('You need to be logged in to set up your seller profile')
      router.push('/login?redirect=/seller/setup')
      return
    }
    if (csrfData) setIsLoading(false)
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
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) newErrors.phone = 'Phone number is invalid'
    if (!formData.locationId) newErrors.location = 'Please select a complete location'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!user?.avatar && !avatarBase64) newErrors.avatar = 'Profile image is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleLocationSelect = (id: number | null) => {
    setFormData(prev => ({ ...prev, locationId: id ? id.toString() : '' }))
    if (errors.location) setErrors(prev => ({ ...prev, location: '' }))
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateContactInfo()) return
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep !== totalSteps) { handleNext(); return }
    if (!validateContactInfo()) { setCurrentStep(1); return }
    if (!isAuthenticated || !user) { router.push('/login?redirect=/seller/setup'); return }
    if (!csrfData) return
    
    setGeneralError(null)
    try {
      await updateProfile.mutateAsync({
        phone: formData.phone,
        location: formData.locationId ? parseInt(formData.locationId) : undefined,
        address: formData.address || undefined,
        business_name: formData.businessName || undefined,
        business_type: formData.businessType || undefined,
        website: formData.website || undefined,
        bio: formData.bio || undefined,
        avatar: avatarBase64 || undefined,
      })
      completeSellerSetup()
      toast.success('Seller profile completed successfully!')
      router.push('/profile')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete setup.')
    }
  }

  const stepMeta = [
    { num: 1, label: 'Contact Info', desc: 'Phone & location' },
    { num: 2, label: 'Business Info', desc: 'About your store' },
    { num: 3, label: 'Review', desc: 'Final check' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
      <SetupHeader />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl border border-gray-100 rounded-[32px] overflow-hidden relative group transition-all duration-500 hover:shadow-primary/5">
          <ProgressStepper currentStep={currentStep} steps={stepMeta} showMeta={false} />

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded-xl">
              <p className="text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {currentStep === 1 && <ContactStep formData={formData} handleInputChange={handleInputChange} handleLocationSelect={handleLocationSelect} avatarBase64={avatarBase64} setAvatarBase64={setAvatarBase64} errors={errors} setErrors={setErrors} user={user} />}
            {currentStep === 2 && <BusinessStep formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
            {currentStep === 3 && <ReviewStep formData={formData} regions={regions} />}

            <SetupNavigation currentStep={currentStep} totalSteps={totalSteps} handleBack={handleBack} handleNext={handleNext} isPending={updateProfile.isPending} />
          </form>
        </div>
      </div>
    </div>
  )
}
