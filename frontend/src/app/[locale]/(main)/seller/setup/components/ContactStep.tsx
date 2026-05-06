import React from 'react'
import { Input } from '@/components/ui/input'
import { Phone } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import SmartLocationSearch from '@/components/ui/SmartLocationSearch'
import { Country, Location } from '@/api/countries'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ContactStepProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleLocationSelect: (location: Location | null, country: Country | null) => void
  initialLocationId?: number
  initialCountryId?: number
  avatarBase64: string | null
  setAvatarBase64: (value: string | null) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  user: any
  onCountrySelect?: (country: Country | null) => void
}

export default function ContactStep({
  formData,
  handleInputChange,
  handleLocationSelect,
  initialLocationId,
  initialCountryId,
  avatarBase64,
  setAvatarBase64,
  errors,
  setErrors,
  user,
  onCountrySelect
}: ContactStepProps) {
  const t = useTranslations('setup')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{t('profile_image')}</h3>
        <p className="text-sm text-gray-600 mt-1">{t('profile_image_desc')}</p>
      </div>
      
      <div className="mb-6">
        <ImageUploader
          value={avatarBase64 || user?.avatar || undefined}
          onChange={(value) => {
            setAvatarBase64(value)
            setErrors(prev => ({ ...prev, avatar: '' }))
          }}
          label={t('profile_image')}
          accept="image/*"
          maxSizeMB={5}
          className={errors.avatar ? 'border-red-500' : ''}
        />
        {errors.avatar && <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>}
        {!user?.avatar && !avatarBase64 && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="text-red-500">*</span> {t('errors.avatar_required')}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">{t('contact_info')}</h3>
        <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t('phone_label')} <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className={`pl-10 h-12 w-full rounded-full border-gray-200 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder={t('phone_placeholder')}
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100 mt-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">{t('location_label')}</h4>
        </div>
        
        <SmartLocationSearch
            initialLocationId={initialLocationId}
            initialCountryId={initialCountryId}
            onLocationSelect={(location, country) => {
                handleLocationSelect(location, country)
                if (onCountrySelect) onCountrySelect(country)
            }}
            error={errors.location}
        />

        <div className="pt-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            {t('address_label')} <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={cn("h-12 w-full rounded-full border-gray-200 pl-4", errors.address && "border-red-500")}
              placeholder={t('address_placeholder')}
            />
          </div>
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
      </div>
    </div>
  )
}
