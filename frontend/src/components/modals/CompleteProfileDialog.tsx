"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useCSRFToken, useCurrentUser } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRegions } from '@/hooks/useRegions'
import { UserCircle, Phone, MapPin, Loader2 } from 'lucide-react'

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
  const [showInlineForm, setShowInlineForm] = useState(showForm)
  
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update region when regions are loaded
  useEffect(() => {
    if (regions && user?.location && !formData.region) {
      const regionId = getUserRegionId()
      if (regionId) {
        setFormData(prev => ({ ...prev, region: regionId }))
      }
    }
  }, [regions, user?.location])

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

  const handleRegionChange = (value: string) => {
    setFormData(prev => ({ ...prev, region: value }))
    if (errors.region) {
      setErrors(prev => ({ ...prev, region: '' }))
    }
  }

  const validateForm = () => {
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
        location: formData.region ? parseInt(formData.region) : undefined,
        address: formData.address || undefined,
        business_name: formData.businessName || undefined,
        business_type: formData.businessType || undefined,
        website: formData.website || undefined,
        bio: formData.bio || undefined,
      })

      completeSellerSetup()
      // Refetch user data to get latest from server
      await refetchUser()
      // Invalidate queries to refresh data
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gray-50 custom-scrollbar  ">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Setup Your Profile
          </DialogTitle>
          <DialogDescription className="text-center text-sm mt-2 text-gray-600">
            Complete your profile to post ads in this category.
          </DialogDescription>
        </DialogHeader>

        {showInlineForm ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
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
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="+234 801 234 5678"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
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

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City / Area <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
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
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? 'border-red-500' : ''}
                    placeholder="Street address"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" size="default" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Complete Setup'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="flex-1"
                size="default"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-2">
            <Button
              onClick={() => setShowInlineForm(true)}
              className="w-full"
              size="default"
            >
              Setup Profile Here
            </Button>
            <Button
              onClick={handleCompleteProfile}
              variant="outline"
              className="w-full"
              size="default"
            >
              Go to Setup Page
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="default"
            >
              Cancel
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}

