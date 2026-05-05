"use client"

import React, { useState, useEffect } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useCSRFToken, useCurrentUser } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRegions } from '@/hooks/useRegions'
import { UserCircle, Phone, MapPin, Loader2 } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import HierarchicalLocationPicker from '@/components/ui/HierarchicalLocationPicker'
import { type Region } from '@/api/regions'
import RegionSelectorModal from '@/components/modals/RegionSelectorModal'

interface CompleteProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  showForm?: boolean
}

export default function CompleteProfileDialog({ isOpen, onClose, showForm = false }: CompleteProfileDialogProps) {
  const router = useRouter()
  const { user, completeSellerSetup } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const { data: csrfData } = useCSRFToken()
  const queryClient = useQueryClient()
  const { refetch: refetchUser } = useCurrentUser()

  const { data: regions, isLoading: regionsLoading } = useRegions()
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    locationId: user?.location ? (regions?.results?.find((r: Region) => r.name === user.location)?.id || '') : '',
    address: user?.address || '',
    businessName: user?.business_name || '',
    businessType: user?.business_type || '',
    website: user?.website || '',
    bio: user?.bio || ''
  })

  // Update location when regions are loaded
  useEffect(() => {
    if (regions?.results && user?.location && !formData.locationId) {
      const matchingRegion = regions.results.find((r: Region) => r.name === user.location)
      if (matchingRegion) {
        setFormData(prev => ({ 
            ...prev, 
            locationId: matchingRegion.id
        }))
      }
    }
  }, [regions, user?.location])

  const [showInlineForm, setShowInlineForm] = useState(showForm)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleLocationSelect = (id: number | null) => {
    setFormData(prev => ({ 
      ...prev, 
      locationId: id || '' 
    }))
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }))
    }
  }

  const handleCompleteProfile = () => {
    if (showInlineForm) {
      setShowInlineForm(true)
    } else {
      onClose()
      router.push('/seller/setup')
    }
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


  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid'
    }

    if (!formData.locationId) {
      newErrors.location = 'Location is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address / Neighborhood is required'
    }

    if (!user?.avatar && !avatarBase64) {
      newErrors.avatar = 'Profile image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!csrfData) {
      toast.error('Please wait for the page to fully load before submitting.')
      return
    }

    try {
      await updateProfile.mutateAsync({
        phone: formData.phone,
        location: formData.locationId ? parseInt(formData.locationId.toString()) : undefined,
        address: formData.address || undefined,
        business_name: formData.businessName || undefined,
        business_type: formData.businessType || undefined,
        website: formData.website || undefined,
        bio: formData.bio || undefined,
        avatar: avatarBase64 || undefined,
      })

      completeSellerSetup()
      await refetchUser()
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Profile completed successfully!')
      onClose()
    } catch (error: any) {
      console.error('Profile setup error:', error)
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
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.detail || 'Failed to complete setup. Please try again.')
      }
    }
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Setup Your Profile"
      description="Complete your profile to post ads in this category."
      className="max-w-2xl"
    >
        <div className="mt-4 pb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>

          {showInlineForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Image</h3>
                <div className="mb-6">
                  <ImageUploader
                    value={avatarBase64 || user?.avatar || undefined}
                    onChange={(value) => {
                      setAvatarBase64(value)
                      if (errors.avatar) {
                        setErrors(prev => ({ ...prev, avatar: '' }))
                      }
                    }}
                    label="Profile Image"
                    accept="image/*"
                    maxSizeMB={5}
                    className={errors.avatar ? 'border-red-500 rounded-3xl' : 'rounded-3xl'}
                  />
                  {errors.avatar && <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`pl-10 rounded-full h-12 ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="+227 92 64 99 99"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="pt-2">
                    <HierarchicalLocationPicker
                      onLocationSelect={handleLocationSelect}
                      errors={{ commune: errors.location }}
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Neighborhood / Street Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`rounded-full h-12 ${errors.address ? 'border-red-500' : ''}`}
                      placeholder="e.g. Plateau, Rue 123"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Hierarchical modal is no longer needed since we use inline picker */}

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 rounded-full" size="lg" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving...' : 'Complete Setup'}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 space-y-3 pb-4">
              <Button
                onClick={() => setShowInlineForm(true)}
                className="w-full rounded-full"
                size="lg"
              >
                Setup Profile Here
              </Button>
              <Button
                onClick={handleCompleteProfile}
                variant="outline"
                className="w-full rounded-full border-gray-200"
                size="lg"
              >
                Go to Setup Page
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full rounded-full"
                size="lg"
              >
                Maybe Later
              </Button>
            </div>
          )}
        </div>
    </ResponsiveModal>
  )
}
