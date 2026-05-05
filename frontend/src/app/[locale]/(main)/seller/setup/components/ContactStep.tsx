import React from 'react'
import { Input } from '@/components/ui/input'
import { Phone, MapPin } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import HierarchicalLocationPicker from '@/components/ui/HierarchicalLocationPicker'

interface ContactStepProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleLocationSelect: (id: number | null) => void
  avatarBase64: string | null
  setAvatarBase64: (value: string | null) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  user: any
}

export default function ContactStep({
  formData,
  handleInputChange,
  handleLocationSelect,
  avatarBase64,
  setAvatarBase64,
  errors,
  setErrors,
  user
}: ContactStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Image</h3>
        <p className="text-sm text-gray-600 mt-1">Upload your profile image to help buyers recognize you.</p>
      </div>
      
      <div className="mb-6">
        <ImageUploader
          value={avatarBase64 || user?.avatar || undefined}
          onChange={(value) => {
            setAvatarBase64(value)
            setErrors(prev => ({ ...prev, avatar: '' }))
          }}
          label="Profile Image"
          accept="image/*"
          maxSizeMB={5}
          className={errors.avatar ? 'border-red-500' : ''}
        />
        {errors.avatar && <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>}
        {!user?.avatar && !avatarBase64 && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="text-red-500">*</span> Profile image is required
          </p>
        )}
      </div>

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
              className={`pl-10 h-12 rounded-full border-gray-200 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+227 92 64 99 99"
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100 mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Location Details</h4>
        <HierarchicalLocationPicker
            onLocationSelect={handleLocationSelect}
            errors={{ commune: errors.location }}
        />

        <div className="pt-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Neighborhood / Street Address <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              className={`pl-10 h-12 rounded-full border-gray-200 ${errors.address ? 'border-red-500' : ''}`}
              placeholder="e.g., Plateau, Rue 123"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
      </div>
    </div>
  )
}
