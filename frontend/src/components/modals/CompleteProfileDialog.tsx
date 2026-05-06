"use client"

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useCSRFToken, useCurrentUser } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocations } from '@/hooks/useLocations'
import { useTranslations } from 'next-intl'
import { UserCircle, Phone, MapPin } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import SmartLocationSearch from '@/components/ui/SmartLocationSearch'
import { type Location, type Country } from '@/api/countries'
import { cn } from '@/lib/utils'

interface CompleteProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  showForm?: boolean
}

export default function CompleteProfileDialog({ isOpen, onClose, showForm = false }: CompleteProfileDialogProps) {
  const t = useTranslations('setup')
  const router = useRouter()
  const { user, completeSellerSetup } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const { data: csrfData } = useCSRFToken()
  const queryClient = useQueryClient()
  const { refetch: refetchUser } = useCurrentUser()

  const [addressSearch, setAddressSearch] = useState('')
  const { data: addressSuggestions, isLoading: addressLoading } = useLocations(
    { 
      search: addressSearch.length >= 2 ? addressSearch : undefined,
      level: 'all' // HDX data detail
    },
    { enabled: addressSearch.length >= 2 }
  )

  const addressOptions = React.useMemo(() => 
    addressSuggestions?.results.map(r => ({
      value: r.name,
      label: r.name,
      description: r.full_name
    })) || [], 
    [addressSuggestions]
  )

  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    locationId: user?.location_id?.toString() || '',
    address: user?.address || '',
    businessName: user?.business_name || '',
    businessType: user?.business_type || '',
    website: user?.website || '',
    bio: user?.bio || '',
    countryId: user?.country_id?.toString() || ''
  })

  // Sync with user data once loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || prev.phone,
        locationId: user.location_id?.toString() || prev.locationId,
        countryId: user.country_id?.toString() || prev.countryId,
        address: user.address || prev.address
      }))
    }
  }, [user])

  const [showInlineForm, setShowInlineForm] = useState(showForm)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleLocationSelect = (location: Location | null, country: Country | null) => {
    setFormData(prev => ({ 
      ...prev, 
      locationId: location?.id ? location.id.toString() : '',
      countryId: country?.id ? country.id.toString() : ''
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
      newErrors.phone = t('errors.phone_required')
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = t('errors.phone_invalid')
    }

    if (!formData.locationId) {
      newErrors.location = t('errors.location_required')
    }

    if (!formData.address.trim()) {
      newErrors.address = t('errors.address_required')
    }

    if (!user?.avatar && !avatarBase64) {
      newErrors.avatar = t('errors.avatar_required')
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
        country: formData.countryId ? parseInt(formData.countryId.toString()) : undefined,
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
      toast.success(t('complete_button'))
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto custom-scrollbar">
        <SheetHeader className="hidden">
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 pb-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('profile_image_desc')}</p>
          </div>

          {showInlineForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile_image')}</h3>
                <div className="mb-6">
                  <ImageUploader
                    value={avatarBase64 || user?.avatar || undefined}
                    onChange={(value) => {
                      setAvatarBase64(value)
                      if (errors.avatar) {
                        setErrors(prev => ({ ...prev, avatar: '' }))
                      }
                    }}
                    label={t('profile_image')}
                    accept="image/*"
                    maxSizeMB={5}
                    className={errors.avatar ? 'border-red-500 rounded-3xl' : 'rounded-3xl'}
                  />
                  {errors.avatar && <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('contact_info')}</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phone_label')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`pl-10 rounded-full h-12 w-full ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder={t('phone_placeholder')}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('location_label')} <span className="text-red-500">*</span>
                    </label>
                    <SmartLocationSearch
                      initialLocationId={user?.location_id || undefined}
                      initialCountryId={user?.country_id || undefined}
                      onLocationSelect={handleLocationSelect}
                      error={errors.location}
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('address_label')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={cn("rounded-full h-12 w-full", errors.address ? "border-red-500" : "border-gray-200")}
                        placeholder={t('address_placeholder')}
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 rounded-full" size="lg" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? t('saving') : t('complete_button')}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  {t('cancel')}
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
                {t('setup_here')}
              </Button>
              <Button
                onClick={handleCompleteProfile}
                variant="outline"
                className="w-full rounded-full border-gray-200"
                size="lg"
              >
                {t('go_to_setup')}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full rounded-full"
                size="lg"
              >
                {t('maybe_later')}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
