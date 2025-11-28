'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import BasicInfoStep from '@/components/create-ad/BasicInfoStep'
import DetailsStep from '@/components/create-ad/DetailsStep'
import ReviewStep from '@/components/create-ad/ReviewStep'
import { useCategories } from '@/hooks/useCategories'
import { useCreateAd } from '@/hooks/useAds'
import { useAuthStore } from '@/store/authStore'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import CompleteProfileDialog from '@/components/modals/CompleteProfileDialog'
import type { CategoryTree } from '@/types/category'
import type { CreateAdRequest } from '@/api/types'
import type { CustomFieldConfig } from '@/components/create-ad/DynamicFormFields'

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

const initialFormData: FormData = {
  adType: '',
  category: '',
  title: '',
  description: '',
  price: '',
  isNegotiable: false,
  contactForPrice: false,
  images: [],
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function CreateAdClient() {
  const router = useRouter()
  const createAd = useCreateAd()
  const { categoryTree, loading: categoriesLoading } = useCategories()
  const { isAuthenticated, user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customFields, setCustomFields] = useState<CustomFieldConfig[] | string[]>([])
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  // All hooks must be called before any conditional returns
  const findNodeBySlug = React.useCallback((nodes: CategoryTree[], slug: string): CategoryTree | null => {
    for (const node of nodes) {
      if (node.slug === slug) return node
      if (node.children?.length) {
        const found = findNodeBySlug(node.children, slug)
        if (found) return found
      }
    }
    return null
  }, [])

  const findPathForSlug = React.useCallback(
    (nodes: CategoryTree[], slug: string, trail: string[] = []): string[] | null => {
      for (const node of nodes) {
        const nextTrail = [...trail, node.slug]
        if (node.slug === slug) return nextTrail
        if (node.children?.length) {
          const result = findPathForSlug(node.children, slug, nextTrail)
          if (result) return result
        }
      }
      return null
    },
    []
  )

  const getNodeByPath = React.useCallback(
    (nodes: CategoryTree[], path: string[]): CategoryTree | null => {
      let currentNodes = nodes
      let current: CategoryTree | null = null
      for (const slug of path) {
        current = currentNodes.find((node) => node.slug === slug) || null
        if (!current) return null
        currentNodes = current.children || []
      }
      return current
    },
    []
  )

  useEffect(() => {
    if (!formData.category || !categoryTree.length) return
    const existingPath = findPathForSlug(categoryTree, formData.category)
    if (existingPath) {
      setCategoryPath(existingPath)
      const node = findNodeBySlug(categoryTree, formData.category)
      setCustomFields(node?.custom_fields || [])
    }
  }, [categoryTree, formData.category, findPathForSlug, findNodeBySlug])

  const resetAttributeFields = React.useCallback(() => {
    setFormData((prev) => {
      const updated = { ...prev }
      ATTRIBUTE_FIELDS.forEach((field) => {
        if (field in updated) delete updated[field]
      })
      return updated
    })
  }, [])

  const handleCategoryLevelChange = (level: number, slug: string) => {
    setCategoryPath((prev) => {
      const next = prev.slice(0, level)
      if (slug) {
        next[level] = slug
      }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next.category
      return next
    })
  }

  useEffect(() => {
    if (!categoryTree.length) return
    const node = getNodeByPath(categoryTree, categoryPath)
    if (node) {
      // Get customFields from the leaf node (last in path) - only leaf categories have customFields
      const isLeaf = !node.children || node.children.length === 0
      const customFieldsToUse = isLeaf 
        ? (node.customFields || node.custom_fields || [])
        : []
      
      setCustomFields(customFieldsToUse)
      setFormData((prev) => {
        const updates: Partial<FormData> = { adType: node.type || '' }
        if (isLeaf) {
          updates.category = node.slug
          return { ...prev, ...updates }
        }
        if (prev.category) {
          resetAttributeFields()
        }
        updates.category = ''
        return { ...prev, ...updates }
      })
    } else {
      setCustomFields([])
      setFormData((prev) => ({ ...prev, category: '', adType: '' }))
    }
  }, [categoryPath, categoryTree, getNodeByPath, resetAttributeFields, user])

  const selectedCategory = useMemo(
    () => getNodeByPath(categoryTree, categoryPath),
    [categoryTree, categoryPath, getNodeByPath]
  )

  // Check if seller profile is required for current category
  const requiresSellerProfile = useMemo(() => {
    if (!selectedCategory || !user) return false
    // Only non-job categories require seller profile
    if (selectedCategory.type === 'job') return false
    
    const hasBusinessProfile = user.is_seller_account_setup || 
      (user.phone && user.phone.trim() !== '' && user.location && user.location.trim() !== '')
    
    return !hasBusinessProfile
  }, [selectedCategory, user])

  // Check authentication only - must be after all hooks
  useEffect(() => {
    // Skip if already redirected (check current pathname)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/create-ad') {
        return
      }
    }

    if (!isAuthenticated) {
      toast.error('You need to be logged in to post an ad', { id: 'auth-required' })
      router.push('/login?redirect=/create-ad')
      return
    }

    setIsCheckingAuth(false)
  }, [isAuthenticated, router])

  // Show loader while checking authentication - AFTER all hooks
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MarketplaceLoader size="md" message="Checking authentication..." />
      </div>
    )
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
    
    setFormData((prev) => {
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
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
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
    const nextErrors: Record<string, string> = {}
    
    if (stepNumber === 1) {
      if (!formData.category) nextErrors.category = 'Category is required'
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
      if (formData.adType === 'cv' && !formData.cv_file) {
        nextErrors.cv_file = 'Please upload your CV'
      }
      
      // Validate required custom fields
      customFields.forEach((field) => {
        const fieldName = typeof field === 'string' ? field : field.name
        const fieldConfig = typeof field === 'object' ? field : null
        const value = formData[fieldName]
        
        if (fieldConfig?.required) {
          if (fieldConfig.type === 'array') {
            if (!Array.isArray(value) || value.length === 0) {
              nextErrors[fieldName] = `${fieldConfig.label} is required`
            }
          } else if (!value || (typeof value === 'string' && !value.trim())) {
            nextErrors[fieldName] = `${fieldConfig.label} is required`
          }
        }
      })
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    // Check if seller profile is required
    if (requiresSellerProfile) {
      setShowProfileDialog(true)
      return
    }
    
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setStep((prev) => prev - 1)
  }

  const buildAttributes = () => {
    const attributes: Record<string, any> = {}
    customFields.forEach((field) => {
      // Handle both old format (string) and new format (CustomFieldConfig)
      const fieldName = typeof field === 'string' ? field : field.name
      const value = formData[fieldName]
      
      // Skip empty values, but include arrays even if empty (they might be intentionally empty)
      if (value !== undefined && value !== '' && value !== null) {
        // For array types, include the array even if empty
        if (typeof field === 'object' && field.type === 'array') {
          attributes[fieldName] = Array.isArray(value) ? value : []
        } else if (Array.isArray(value) && value.length > 0) {
          attributes[fieldName] = value
        } else if (!Array.isArray(value)) {
          attributes[fieldName] = value
        }
      }
    })
    if (formData.cv_file) {
      attributes.cv_file_name = formData.cv_file.name
    }
    return attributes
  }

  const serializeImages = async () => {
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
    
    // Check if seller profile is required before submitting
    if (requiresSellerProfile) {
      setShowProfileDialog(true)
      return
    }
    
    if (step < 3) {
      setStep(3)
      return
    }
    if (!validateStep(step)) return
    
    // Ensure we have a category selected
    const categorySlug = selectedCategory?.slug || categoryPath[categoryPath.length - 1] || formData.category
    if (!categorySlug) {
      toast.error('Please select a category')
      return
    }

    try {
      const payload: CreateAdRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: categorySlug,
        price: formData.price ? String(formData.price) : null,
        currency: 'XOF',
        is_negotiable: formData.isNegotiable || false,
        attributes: buildAttributes(),
        images: await serializeImages(),
        status: 'published' as const,
      }

      console.log('Submitting payload:', payload)
      await createAd.mutateAsync(payload)
      toast.success('Ad created successfully!')
      router.push('/profile?tab=ads')
    } catch (error: any) {
      console.error('Create ad error:', error)
      const errorData = error?.response?.data
      if (errorData) {
        console.error('Error details:', errorData)
        // Show specific field errors if available
        if (errorData.category) {
          toast.error(`Category: ${Array.isArray(errorData.category) ? errorData.category[0] : errorData.category}`)
        } else if (errorData.price) {
          toast.error(`Price: ${Array.isArray(errorData.price) ? errorData.price[0] : errorData.price}`)
        } else if (errorData.non_field_errors) {
          toast.error(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors)
        } else {
          toast.error(errorData.message || errorData.detail || 'Failed to create ad. Please check all fields.')
        }
      } else {
        toast.error('Failed to create ad. Please try again.')
      }
    }
  }

  const currentStepTitle =
    formData.adType === 'cv'
      ? 'Post Your CV'
      : formData.adType === 'job'
        ? 'Post a Job'
        : formData.adType === 'service'
          ? 'Post a Service'
          : 'Post an Ad'

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white border border-gray-200 shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{currentStepTitle}</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Reach thousands of buyers by sharing accurate details about your listing.
            </p>
          </div>

          <ProgressStepper currentStep={step} steps={STEPS} showMeta={false} />

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <BasicInfoStep
                formData={formData}
                errors={errors}
                categoryTree={categoryTree}
                categoryPath={categoryPath}
                onCategoryLevelChange={handleCategoryLevelChange}
                onInputChange={handleInputChange}
                selectedCategoryLabel={
                  categoryPath.length
                    ? categoryPath
                        .map((slug) => findNodeBySlug(categoryTree, slug)?.name)
                        .filter(Boolean)
                        .join(' / ')
                    : undefined
                }
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
                selectedCategoryLabel={
                  categoryPath
                    .map((slug) => findNodeBySlug(categoryTree, slug)?.name)
                    .filter(Boolean)
                    .join(' / ')
                }
                categoryPath={categoryPath.map((slug) => ({
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
                  disabled={categoriesLoading || requiresSellerProfile}
                  className="order-1 sm:order-2"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createAd.isPending || requiresSellerProfile} 
                  className="order-1 sm:order-2"
                >
                  {createAd.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
          By posting, you agree to our{' '}
          <a href="/terms" className="text-secondary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-secondary hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>

      <CompleteProfileDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
    </div>
  )
}
