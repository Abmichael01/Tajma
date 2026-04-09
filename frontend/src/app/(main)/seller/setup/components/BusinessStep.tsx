import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Globe } from 'lucide-react'
import { businessTypes } from './constants'

interface BusinessStepProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

export default function BusinessStep({
  formData,
  handleInputChange,
  setFormData
}: BusinessStepProps) {
  return (
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
              className="pl-10 h-12 rounded-full border-gray-200"
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
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, businessType: value }))}
          >
            <SelectTrigger className="h-12 rounded-full border-gray-200">
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
            className="pl-10 h-12 rounded-full border-gray-200"
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
          className="mt-1 rounded-2xl border-gray-200"
          placeholder="Share what makes your business unique, your experience, and what buyers can expect..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/500</p>
      </div>
    </div>
  )
}
