"use client"

import React from 'react'
import Image from 'next/image'
import { CheckCircle, Info, X, Image as ImageIcon } from 'lucide-react'
import { nigerianStates } from '@/data/categoriesData'

interface ReviewStepProps {
  formData: any
  selectedCategory: any
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export default function ReviewStep({
  formData,
  selectedCategory,
  onImageUpload,
  onRemoveImage
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Images & Review</h2>
        <p className="text-sm text-gray-600 mt-1">Add images and review your listing</p>
      </div>

      {/* Images Upload - Only for products and services */}
      {formData.adType !== 'cv' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Images {formData.adType === 'product' ? '(Recommended)' : '(Optional)'}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-secondary/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer block">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Click to upload images</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB each (max 10 images)</p>
            </label>
          </div>
          
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {formData.images.map((file: File, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
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
      )}

      {/* Review Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          Review Your {formData.adType === 'cv' ? 'CV Post' : formData.adType === 'service' ? 'Service Listing' : 'Ad'}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="text-gray-900 capitalize">{formData.adType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Category:</span>
            <span className="text-gray-900">{selectedCategory?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Title:</span>
            <span className="text-gray-900">{formData.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Location:</span>
            <span className="text-gray-900">{nigerianStates.find(s => s.value === formData.state)?.label}, {formData.city}</span>
          </div>
          {formData.adType === 'product' && formData.price && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Price:</span>
              <span className="text-gray-900">
                ₦{parseInt(formData.price).toLocaleString()} {formData.isNegotiable && '(Negotiable)'}
              </span>
            </div>
          )}
          {formData.adType === 'cv' && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">CV:</span>
              <span className="text-gray-900">{formData.cv_file?.name}</span>
            </div>
          )}
          {formData.adType !== 'cv' && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Images:</span>
              <span className="text-gray-900">{formData.images.length} uploaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Before you post:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ensure all information is accurate and complete</li>
              <li>Check that your contact details are correct</li>
              <li>Make sure images are clear and relevant</li>
              <li>Review our posting guidelines and terms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

