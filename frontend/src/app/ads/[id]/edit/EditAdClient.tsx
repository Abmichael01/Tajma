'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { mockAds } from '@/data/mockAds'
import {
  getCategoryById,
  getSubcategoryOptions,
  getCategoryType,
  getCustomFieldsByCategoryId,
} from '@/data/categoriesData'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import BasicInfoStep from '@/components/create-ad/BasicInfoStep'
import DetailsStep from '@/components/create-ad/DetailsStep'
import ReviewStep from '@/components/create-ad/ReviewStep'
import { Loader2 } from 'lucide-react'

interface EditAdClientProps {
  adId: string
}

const STEPS = [
  { num: 1, label: 'Basic Info', desc: 'Category & Location' },
  { num: 2, label: 'Details', desc: 'Description & Pricing' },
  { num: 3, label: 'Review', desc: 'Images & Submit' }
]

export default function EditAdClient({ adId }: EditAdClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>(null)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [subcategoryOptions, setSubcategoryOptions] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<string[]>([])

  // Load ad data
  useEffect(() => {
    const loadAd = async () => {
      setIsLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const ad = mockAds.find(a => a.id === adId)
      
      if (ad) {
        // Convert ad to form data
        const priceNumber = ad.price.replace(/[₦,]/g, '').split('/')[0]
        
        setFormData({
          adType: ad.category === 'jobs' ? 'cv' : 'product',
          title: ad.title,
          description: ad.description || '',
          category: ad.category || '',
          subcategory: ad.subcategory || '',
          state: ad.state || '',
          city: ad.city || '',
          price: priceNumber,
          isNegotiable: false,
          images: [], // Existing images would be loaded separately
          contactPhone: '',
          contactEmail: '',
          brand: ad.brand,
          condition: ad.condition,
        })
      } else {
        alert('Ad not found')
        router.push('/profile')
      }
      
      setIsLoading(false)
    }
    
    loadAd()
  }, [adId, router])

  // Update subcategories when form data loads
  useEffect(() => {
    if (formData?.category) {
      const category = getCategoryById(formData.category)
      setSelectedCategory(category)
      setSubcategoryOptions(getSubcategoryOptions(formData.category))
      setCustomFields(getCustomFieldsByCategoryId(formData.category))
    }
  }, [formData?.category])

  const handleInputChange = (field: any, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + (formData?.images?.length || 0) > 10) {
      alert('Maximum 10 images allowed')
      return
    }
    setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), ...files] }))
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('CV file size must be less than 5MB')
        return
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        alert('Only PDF and Word documents are allowed')
        return
      }
      setFormData((prev: any) => ({ ...prev, cv_file: file }))
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: (prev.images || []).filter((_: any, i: number) => i !== index)
    }))
  }

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: any = {}
    
    if (stepNumber === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.state) newErrors.state = 'State is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
    }
    
    if (stepNumber === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (formData.adType === 'product' && !formData.price.trim()) {
        newErrors.price = 'Price is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(step)) return
    
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Updated Ad Data:', formData)
      
      // Redirect back to profile
      router.push('/profile?tab=ads&success=ad-updated')
    } catch (error) {
      console.error('Error updating ad:', error)
      alert('Failed to update ad. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-gray-600">Loading ad data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Edit Your Ad
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Update your listing information
            </p>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper currentStep={step} steps={STEPS} />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <BasicInfoStep
                formData={formData}
                errors={errors}
                subcategoryOptions={subcategoryOptions}
                selectedCategory={selectedCategory}
                onInputChange={handleInputChange}
                isEditMode={true}
              />
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <DetailsStep
                formData={formData}
                errors={errors}
                customFields={customFields}
                onInputChange={handleInputChange}
                onCVUpload={handleCVUpload}
              />
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <ReviewStep
                formData={formData}
                selectedCategory={selectedCategory}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
              />
            )}

            {/* Navigation Buttons */}
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
                  onClick={handleNext}
                  className="order-1 sm:order-2"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="order-1 sm:order-2"
                >
                  {isSubmitting ? (
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

        {/* Footer */}
        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:underline"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  )
}

