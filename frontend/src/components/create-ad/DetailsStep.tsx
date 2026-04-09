"use client"

import React, { useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUp, Image as ImageIcon } from 'lucide-react'
import DynamicFormFields from './DynamicFormFields'
import type { CustomFieldConfig } from './DynamicFormFields'
import { cn } from '@/lib/utils'

interface DetailsStepProps {
  formData: any
  errors: any
  customFields: CustomFieldConfig[] | string[]
  onInputChange: (field: any, value: any) => void
  onCVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export default function DetailsStep({
  formData,
  errors,
  customFields,
  onInputChange,
  onCVUpload,
  onImageUpload,
  onRemoveImage,
}: DetailsStepProps) {
  const imagePreviews = useMemo(() => {
    return (formData.images || []).map((img: File | string) => {
      if (typeof img === 'string') return img
      return URL.createObjectURL(img)
    })
  }, [formData.images])

  useEffect(() => {
    const files = formData.images || []
    return () => {
      imagePreviews.forEach((preview: string, idx: number) => {
        if (files[idx] instanceof File) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [imagePreviews, formData.images])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Details & Pricing</h2>
        <p className="text-sm text-gray-600 mt-1">Provide detailed information</p>
      </div>

      {/* Custom Fields from Category Configuration - Shown First */}
      <DynamicFormFields formData={formData} customFields={customFields} onInputChange={onInputChange} />

      {/* Ad Model Fields - Shown Last */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Price (CFA) {formData.adType === 'product' && !formData.contactForPrice ? <span className="text-red-500">*</span> : ''}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Fr</span>
          <Input
            value={formData.price || ''}
            onChange={(e) => onInputChange('price', e.target.value.replace(/[^0-9]/g, ''))}
            disabled={formData.contactForPrice}
            placeholder={
              formData.adType === 'product'
                ? 'Enter price'
                : formData.adType === 'service'
                  ? 'Starting from...'
                  : formData.adType === 'job'
                    ? 'e.g., Salary range'
                    : formData.adType === 'cv'
                      ? 'e.g., Expected salary'
                      : 'Enter price'
            }
            type="text"
            className={cn(
               "pl-9 h-12 rounded-full border-gray-200 focus:border-primary focus:ring-primary/20",
               formData.contactForPrice ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-gray-50/30'
            )}
          />
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="border border-gray-200 p-4 rounded-2xl bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Checkbox
                id="contactForPrice"
                checked={formData.contactForPrice || false}
                onCheckedChange={(checked) => {
                  onInputChange('contactForPrice', checked === true)
                  if (checked) {
                    onInputChange('price', '')
                  }
                }}
              />
              <label htmlFor="contactForPrice" className="text-sm text-gray-900 cursor-pointer font-medium">
                Contact for price
              </label>
            </div>
          </div>
          
          {!formData.contactForPrice && (
            <div className="border border-gray-200 p-4 rounded-2xl bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="negotiable"
                  checked={formData.isNegotiable || false}
                  onCheckedChange={(checked) => onInputChange('isNegotiable', checked === true)}
                />
                <label htmlFor="negotiable" className="text-sm text-gray-900 cursor-pointer font-medium">
                  Price is negotiable
                </label>
              </div>
            </div>
          )}
        </div>
        
        {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder={
            formData.adType === 'cv'
              ? "Describe your experience, skills, and what you're looking for..."
              : formData.adType === 'job'
                ? 'Describe the job role, responsibilities, requirements, and what you offer...'
                : formData.adType === 'service'
                  ? 'Describe the service you offer, your experience, and what clients can expect...'
                  : 'Describe your item in detail - condition, features, etc...'
          }
          rows={6}
          maxLength={5000}
          className={cn(
            "w-full px-5 py-4 border rounded-[2rem] resize-none transition-all focus:outline-none focus:ring-primary/20 focus:border-primary bg-gray-50/30",
            errors.description ? 'border-red-500' : 'border-gray-200'
          )}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          <p className="text-xs text-gray-500 ml-auto">{formData.description.length}/5000</p>
        </div>
      </div>

      {formData.adType === 'cv' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Upload Your CV <span className="text-red-500">*</span>
          </label>
          <div
            className={cn(
            "border-2 border-dashed p-10 text-center transition-all rounded-[2.5rem]",
            formData.cv_file || formData.existingCvFileName ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 bg-gray-50/50'
          )}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={onCVUpload}
              className="hidden"
              id="cv-upload"
            />
            <label htmlFor="cv-upload" className="cursor-pointer block">
              <FileUp
                className={`w-12 h-12 mx-auto mb-2 ${
                  formData.cv_file || formData.existingCvFileName ? 'text-secondary' : 'text-gray-400'
                }`}
              />
              {formData.cv_file ? (
                <div className="text-secondary font-medium text-sm">✓ {formData.cv_file.name}</div>
              ) : formData.existingCvFileName ? (
                <div className="text-secondary font-medium text-sm">
                  Current file: {formData.existingCvFileName}
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
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Images {formData.adType === 'product' ? '(Recommended)' : '(Optional)'}
        </label>
        <div className="border-2 border-dashed border-gray-200 p-10 rounded-[2.5rem] bg-gray-50/50 text-center hover:border-primary/50 transition-all group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer block">
            <div className="w-16 h-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors border border-gray-100 shadow-sm">
                <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-gray-900 font-medium text-sm mb-1">Upload images</p>
            <p className="text-xs text-gray-500">PNG, JPG up to 5MB (max 10 images)</p>
          </label>
        </div>

        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {formData.images.map((_item: File | string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={imagePreviews[index]}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 bg-secondary text-white text-xs px-2 py-0.5 rounded">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


