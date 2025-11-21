"use client"

import React, { useMemo, useEffect } from 'react'
import { CheckCircle, Info } from 'lucide-react'

interface ReviewStepProps {
  formData: any
  selectedCategoryLabel?: string
  categoryPath?: { name: string; slug: string }[]
}

export default function ReviewStep({
  formData,
  selectedCategoryLabel,
  categoryPath = [],
}: ReviewStepProps) {
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
        <h2 className="text-lg font-semibold text-gray-900">Review</h2>
        <p className="text-sm text-gray-600 mt-1">Review your listing before publishing</p>
      </div>

      <div className=" ">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          Review Your {formData.adType === 'cv' ? 'CV Post' : formData.adType === 'service' ? 'Service Listing' : 'Ad'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Category</p>
            <p className="text-base text-gray-900">
              {categoryPath.length > 0
                ? categoryPath.map((node) => node.name).join(' / ')
                : selectedCategoryLabel || 'Not selected'}
            </p>
          </div>

          <div className="border border-gray-200 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Title</p>
            <p className="text-base text-gray-900">{formData.title}</p>
          </div>

          {formData.price && (
            <div className="border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Price</p>
              <p className="text-base text-gray-900">
                Fr {parseInt(formData.price, 10).toLocaleString()}{' '}
                {formData.isNegotiable && (
                  <span className="text-sm text-gray-500">(Negotiable)</span>
                )}
              </p>
            </div>
          )}

          {formData.adType !== 'cv' && (
            <div className="border border-gray-200 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Images</p>
              {formData.images && formData.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imagePreviews.map((preview: string, index: number) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-500">No images added</p>
              )}
            </div>
          )}

          {formData.adType === 'cv' && (
            <div className="border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">CV File</p>
              <p className="text-base text-gray-900">
                {formData.cv_file?.name || formData.existingCvFileName || 'Not uploaded'}
              </p>
            </div>
          )}

          {formData.description && (
            <div className="border border-gray-200 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Description</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Before you post:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ensure all information is accurate and complete</li>
              <li>Check that your profile contact details are up to date</li>
              <li>Make sure images are clear and relevant</li>
              <li>Review our posting guidelines and terms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

