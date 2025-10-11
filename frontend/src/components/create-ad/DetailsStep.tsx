"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { FileUp } from 'lucide-react'
import DynamicFormFields from './DynamicFormFields'

interface DetailsStepProps {
  formData: any
  errors: any
  customFields: string[]
  onInputChange: (field: any, value: any) => void
  onCVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function DetailsStep({
  formData,
  errors,
  customFields,
  onInputChange,
  onCVUpload
}: DetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Details & Pricing</h2>
        <p className="text-sm text-gray-600 mt-1">Provide detailed information</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder={
            formData.adType === 'cv' 
              ? 'Describe your experience, skills, and what you\'re looking for...' 
              : formData.adType === 'service'
                ? 'Describe the service you offer, your experience, and what clients can expect...'
                : 'Describe your item in detail - condition, features, etc...'
          }
          rows={6}
          maxLength={5000}
          className={`w-full px-3 py-2 border rounded-lg resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          <p className="text-xs text-gray-500 ml-auto">{formData.description.length}/5000</p>
        </div>
      </div>

      {/* Price - For Products */}
      {formData.adType === 'product' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Price (₦) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">₦</span>
            <Input
              value={formData.price}
              onChange={(e) => onInputChange('price', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              type="text"
              className={`pl-8 ${errors.price ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.isNegotiable}
              onChange={(e) => onInputChange('isNegotiable', e.target.checked)}
              className="rounded border-gray-300 text-secondary focus:ring-secondary"
            />
            <label htmlFor="negotiable" className="text-sm text-gray-600">
              Price is negotiable
            </label>
          </div>
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>
      )}

      {/* Service Fee - Optional */}
      {formData.adType === 'service' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Service Fee (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">₦</span>
            <Input
              value={formData.price}
              onChange={(e) => onInputChange('price', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Starting from..."
              type="text"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Leave blank if you prefer to discuss pricing with clients</p>
        </div>
      )}

      {/* CV Upload */}
      {formData.adType === 'cv' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload Your CV <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              formData.cv_file ? 'border-secondary bg-secondary/5' : 'border-gray-300'
            }`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={onCVUpload}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload" className="cursor-pointer block">
                <FileUp className={`w-12 h-12 mx-auto mb-2 ${formData.cv_file ? 'text-secondary' : 'text-gray-400'}`} />
                {formData.cv_file ? (
                  <div className="text-secondary font-medium text-sm">
                    ✓ {formData.cv_file.name}
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-1">Click to upload your CV</p>
                    <p className="text-xs text-gray-500">PDF or Word (Max 5MB)</p>
                  </>
                )}
              </label>
            </div>
            {errors.cv_file && <p className="text-red-500 text-sm mt-2">{errors.cv_file}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Experience Years</label>
              <Input
                value={formData.experience_years}
                onChange={(e) => onInputChange('experience_years', e.target.value)}
                placeholder="e.g., 5"
                type="number"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Education Level</label>
              <Input
                value={formData.education_level}
                onChange={(e) => onInputChange('education_level', e.target.value)}
                placeholder="e.g., BSc, MSc"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Key Skills</label>
            <Input
              value={formData.skills}
              onChange={(e) => onInputChange('skills', e.target.value)}
              placeholder="e.g., JavaScript, React, Node.js, Python"
            />
            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Desired Salary (Optional)</label>
            <Input
              value={formData.desired_salary}
              onChange={(e) => onInputChange('desired_salary', e.target.value)}
              placeholder="e.g., ₦150,000 - ₦200,000 monthly"
            />
          </div>
        </>
      )}

      {/* Dynamic Custom Fields */}
      <DynamicFormFields
        formData={formData}
        customFields={customFields}
        onInputChange={onInputChange}
      />

      {/* Contact Information */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Contact Information</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            value={formData.contactPhone}
            onChange={(e) => onInputChange('contactPhone', e.target.value)}
            placeholder="Phone number"
            type="tel"
          />
          <Input
            value={formData.contactEmail}
            onChange={(e) => onInputChange('contactEmail', e.target.value)}
            placeholder="Email address"
            type="email"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">At least one contact method is recommended</p>
      </div>
    </div>
  )
}

