"use client"

import React, { useMemo, useEffect } from 'react'
import { CheckCircle, Info } from 'lucide-react'
import type { CustomFieldConfig } from './DynamicFormFields'

interface ReviewStepProps {
  formData: any
  selectedCategoryLabel?: string
  categoryPath?: { name: string; slug: string }[]
  attributes?: Record<string, any>
  customFields?: CustomFieldConfig[] | string[]
}

import { useTranslations } from 'next-intl'

export default function ReviewStep({
  formData,
  selectedCategoryLabel,
  categoryPath = [],
  attributes = {},
  customFields = [],
}: ReviewStepProps) {
  const t = useTranslations('create_ad')
  const tCommon = useTranslations('common')
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
        <h2 className="text-lg font-medium text-gray-900">{t('review')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('review_listing_before_publishing')}</p>
      </div>

      <div className=" ">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          {formData.adType === 'cv' ? t('review_cv_post') : formData.adType === 'service' ? t('review_service_listing') : t('review_ad_title')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 p-5 rounded-2xl bg-gray-50/30">
            <p className="text-[10px] font-medium text-gray-400 mb-1">{t('category')}</p>
            <p className="text-base font-medium text-gray-900">
              {categoryPath.length > 0
                ? categoryPath.map((node) => node.name).join(' / ')
                : selectedCategoryLabel || '—'}
            </p>
          </div>

          <div className="border border-gray-200 p-5 rounded-2xl bg-gray-50/30 sm:col-span-2">
            <p className="text-[10px] font-medium text-gray-400 mb-1">{t('ad_title')}</p>
            <p className="text-base font-medium text-gray-900">{formData.title}</p>
          </div>

          {formData.price && (
            <div className="border border-gray-200 p-5 rounded-2xl bg-gray-50/30">
              <p className="text-[10px] font-medium text-gray-400 mb-1">{tCommon('price')}</p>
              <p className="text-base font-medium text-gray-900">
                Fr {parseInt(formData.price, 10).toLocaleString()}{' '}
                {formData.isNegotiable && (
                  <span className="text-sm text-gray-500">({t('price_is_negotiable')})</span>
                )}
              </p>
            </div>
          )}

          {formData.adType !== 'cv' && (
            <div className="border border-gray-200 p-5 rounded-[2rem] bg-gray-50/30 sm:col-span-2">
              <p className="text-[10px] font-medium text-gray-400 mb-3">{t('images')}</p>
              {formData.images && formData.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagePreviews.map((preview: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-500">{t('no_images_added')}</p>
              )}
            </div>
          )}

          {formData.adType === 'cv' && (
            <div className="border border-gray-200 p-5 rounded-2xl bg-gray-50/30">
              <p className="text-[10px] font-medium text-gray-400 mb-1">{t('upload_cv')}</p>
              <p className="text-base font-medium text-gray-900">
                {formData.cv_file?.name || formData.existingCvFileName || t('not_uploaded')}
              </p>
            </div>
          )}

          {formData.description && (
            <div className="border border-gray-200 p-5 rounded-[2rem] bg-gray-50/30 sm:col-span-2">
              <p className="text-[10px] font-medium text-gray-400 mb-2">{t('description')}</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
            </div>
          )}

          {/* Attributes Section */}
          {Object.keys(attributes).length > 0 && (
            <div className="border border-gray-200 p-5 rounded-[2rem] bg-gray-50/30 sm:col-span-2">
              <p className="text-[10px] font-medium text-gray-400 mb-4">{t('attributes')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(attributes).map(([key, value]) => {
                  // Skip cv_file_name as it's already shown in CV File section
                  if (key === 'cv_file_name') return null
                  
                  // Find field config to get label
                  const fieldConfig = Array.isArray(customFields) && customFields.length > 0
                    ? (typeof customFields[0] === 'object' 
                        ? (customFields as CustomFieldConfig[]).find(f => f.name === key)
                        : null)
                    : null
                  
                  const label = fieldConfig?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  
                  // Format value based on type
                  let displayValue: string | React.ReactNode = ''
                  if (Array.isArray(value)) {
                    if (value.length === 0) return null
                    // Handle array of objects (for array type fields)
                    if (value.length > 0 && typeof value[0] === 'object') {
                      displayValue = (
                        <div className="space-y-3 mt-1">
                          {value.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 bg-white border border-gray-100 p-3 rounded-xl">
                              {Object.entries(item).map(([k, v]) => {
                                const childField = fieldConfig?.children?.find(f => f.name === k)
                                const childLabel = childField?.label || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                return (
                                  <div key={k} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                                    <span className="font-medium text-gray-400">{childLabel}</span> 
                                    <span className="font-medium text-gray-900">{String(v || '—')}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )
                    } else {
                      // Handle simple array (e.g., tags)
                      displayValue = value.join(', ')
                    }
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? tCommon('yes') : tCommon('no')
                  } else {
                    displayValue = String(value)
                  }
                  
                  return (
                    <div key={key} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] font-medium text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{displayValue}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-6 rounded-[2rem]">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
             <Info className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">{t('before_you_post')}</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">• {t('accurate_info')}</li>
              <li className="flex items-center gap-2">• {t('profile_contact_details')}</li>
              <li className="flex items-center gap-2">• {t('clear_images')}</li>
              <li className="flex items-center gap-2">• {t('posting_guidelines')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

