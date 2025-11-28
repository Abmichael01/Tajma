"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import BasicInfoStep from '@/components/create-ad/BasicInfoStep'
import DetailsStep from '@/components/create-ad/DetailsStep'
import ReviewStep from '@/components/create-ad/ReviewStep'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useCategories } from '@/hooks/useCategories'
import { useAdDetails, useUpdateAd } from '@/hooks/useAds'
import type { CategoryTree } from '@/types/category'

interface EditAdClientProps {
  adId: string
}

interface FormData {
  adType: 'product' | 'service' | 'job' | 'cv' | ''
  category: string
  title: string
  description: string
  price: string
  isNegotiable: boolean
  contactForPrice: boolean
  images: Array<File | string>
  cv_file?: File
  existingCvFileName?: string
  [key: string]: any
}

const STEPS = [
  { num: 1, label: 'Basic Info', desc: 'Category & Overview' },
  { num: 2, label: 'Details', desc: 'Description & Pricing' },
  { num: 3, label: 'Review', desc: 'Confirm & Publish' },
]

const ATTRIBUTE_FIELDS = [
  'brand',
  'model',
  'condition',
  'warranty',
  'year',
  'mileage',
  'transmission',
  'fuel_type',
  'color',
  'bedrooms',
  'bathrooms',
  'furnishing',
  'property_type',
  'size_sqm',
  'job_type',
  'experience_level',
  'salary_range',
  'work_location',
  'application_deadline',
  'service_type',
  'availability',
  'experience_years',
  'education_level',
  'skills',
  'desired_salary',
]

// Helper functions for category tree traversal
const findNodeBySlug = (nodes: CategoryTree[], slug: string): CategoryTree | null => {
  for (const node of nodes) {
    if (node.slug === slug) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeBySlug(node.children, slug)
      if (found) return found
    }
  }
  return null
}

const findPathForSlug = (
  nodes: CategoryTree[],
  slug: string,
  trail: string[] = []
): string[] | null => {
  for (const node of nodes) {
    const nextTrail = [...trail, node.slug]
    if (node.slug === slug) return nextTrail
    if (node.children && node.children.length > 0) {
      const result = findPathForSlug(node.children, slug, nextTrail)
      if (result) return result
    }
  }
  return null
}

const flattenCategories = (nodes: CategoryTree[], parents: CategoryTree[] = []): Array<{
  value: string
  label: string
  pathLabel: string
  icon: string | null
  adType: string | null
  customFields: string[]
}> =>
  nodes.flatMap((node) => {
    const lineage = [...parents, node]
    if (node.children && node.children.length > 0) {
      return flattenCategories(node.children, lineage)
    }
    return [
      {
        value: node.slug,
        label: node.name,
        pathLabel: lineage.map((n) => n.name).join(' / '),
        icon: node.icon ?? null,
        adType: node.type ?? null,
        customFields: node.custom_fields || node.customFields || [],
      },
    ]
  })

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function EditAdClient({ adId }: EditAdClientProps) {
  const router = useRouter()
  const { data: ad, isLoading: adLoading } = useAdDetails(adId, Boolean(adId))
  const updateAd = useUpdateAd(adId)
  const { categoryTree, loading: categoriesLoading } = useCategories()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [customFields, setCustomFields] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const categoryPath = useMemo(() => {
    if (!formData?.category) return []
    const path = findPathForSlug(categoryTree, formData.category)
    return path || []
  }, [categoryTree, formData?.category])

  const categoryLabel = useMemo(() => {
    if (!categoryPath.length) return ''
    return categoryPath
      .map((slug: string) => findNodeBySlug(categoryTree, slug)?.name)
      .filter(Boolean)
      .join(' / ')
  }, [categoryPath, categoryTree])

  useEffect(() => {
    if (!ad) return
    const baseForm: FormData = {
      adType: ad.ad_type,
      category: ad.category,
      title: ad.title,
      description: ad.description,
      price: ad.price ? String(ad.price) : '',
      isNegotiable: ad.is_negotiable,
      contactForPrice: !ad.price,
      images: ad.images || [],
      existingCvFileName: ad.attributes?.cv_file_name,
    }

    ATTRIBUTE_FIELDS.forEach((field) => {
      if (ad.attributes && ad.attributes[field] !== undefined) {
        baseForm[field] = ad.attributes[field]
      }
    })

    setFormData(baseForm)
    const node = findNodeBySlug(categoryTree, ad.category)
    setCustomFields(node?.custom_fields || [])
  }, [ad, categoryTree])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
    
    setFormData((prev) => {
      if (!prev) return prev
      const nextImages = [...prev.images]
      for (const file of files) {
        if (nextImages.length >= 10) {
          toast.error('Maximum of 10 images allowed')
          break
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Image "${file.name}" is too large. Maximum file size is 5MB.`)
          continue
        }
        nextImages.push(file)
      }
      return { ...prev, images: nextImages }
    })
  }

  const removeImage = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }
    })
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CV file size must be less than 5MB')
      return
    }
    handleInputChange('cv_file', file)
  }

  const validateStep = (stepNumber: number) => {
    if (!formData) return false
    const nextErrors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.title.trim()) nextErrors.title = 'Title is required'
    }

    if (stepNumber === 2) {
      if (!formData.description.trim()) nextErrors.description = 'Description is required'
      if (formData.adType === 'product' && !formData.contactForPrice && !formData.price.trim()) {
        nextErrors.price = 'Price is required for product listings, or select "Contact for price"'
      }
      if (formData.adType === 'job' && !formData.salary_range?.trim()) {
        nextErrors.salary_range = 'Salary range is required for job postings'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setStep((prev) => prev - 1)
  }

  const buildAttributes = () => {
    if (!formData) return {}
    const attributes: Record<string, any> = {}
    customFields.forEach((field) => {
      const value = formData[field]
      if (value !== undefined && value !== '') {
        attributes[field] = value
      }
    })
    if (formData.cv_file) {
      attributes.cv_file_name = formData.cv_file.name
    } else if (formData.existingCvFileName) {
      attributes.cv_file_name = formData.existingCvFileName
    }
    return attributes
  }

  const serializeImages = async () => {
    if (!formData) return []
    const files = formData.images || []
    const serialized: string[] = []
    for (const file of files) {
      if (typeof file === 'string') {
        serialized.push(file)
      } else {
        serialized.push(await fileToBase64(file))
      }
    }
    return serialized
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep((prev) => 3)
      return
    }
    if (!validateStep(step) || !formData) return

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price ? formData.price : null,
        currency: 'XOF',
        is_negotiable: formData.isNegotiable,
        attributes: buildAttributes(),
        images: await serializeImages(),
        status: 'published' as const,
      }

      await updateAd.mutateAsync(payload)
      toast.success('Ad updated successfully')
      router.push('/profile?tab=ads')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Failed to update ad')
    }
  }

  if (adLoading || categoriesLoading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MarketplaceLoader size="md" message="Loading ad..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white border border-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Edit Your Ad</h1>
            <p className="text-gray-600 text-sm sm:text-base">Update your listing information</p>
          </div>

          <ProgressStepper currentStep={step} steps={STEPS} showMeta={false} />

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <BasicInfoStep
                formData={formData}
                errors={errors}
                categoryTree={categoryTree}
                categoryPath={categoryPath}
                onCategoryLevelChange={() => {}}
                onInputChange={handleInputChange}
                selectedCategoryLabel={categoryLabel}
                isEditMode
              />
            )}

            {step === 2 && (
              <DetailsStep
                formData={formData}
                errors={errors}
                customFields={customFields}
                onInputChange={handleInputChange}
                onCVUpload={handleCVUpload}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
              />
            )}

            {step === 3 && (
              <ReviewStep
                formData={formData}
                selectedCategoryLabel={categoryLabel}
                categoryPath={categoryPath.map((slug: string) => ({
                  name: findNodeBySlug(categoryTree, slug)?.name || slug,
                  slug,
                }))}
                attributes={buildAttributes()}
                customFields={customFields}
              />
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevious}
                disabled={step === 1}
                className="order-2 sm:order-1"
              >
                Previous
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNext()
                  }}
                  className="order-1 sm:order-2"
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={updateAd.isPending} className="order-1 sm:order-2">
                  {updateAd.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Updating...
                    </>
                  ) : (
                    'Update Ad'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
          <button onClick={() => router.back()} className="text-secondary hover:underline">
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  )
}

