'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  categoriesData,
  getCategoryById,
  getSubcategoryOptions,
  getCategoryType,
  getCustomFieldsByCategoryId,
} from '@/data/categoriesData'
import ProgressStepper from '@/components/create-ad/ProgressStepper'
import BasicInfoStep from '@/components/create-ad/BasicInfoStep'
import DetailsStep from '@/components/create-ad/DetailsStep'
import ReviewStep from '@/components/create-ad/ReviewStep'

interface FormData {
  adType: 'product' | 'service' | 'cv'
  title: string
  description: string
  category: string
  subcategory: string
  state: string
  city: string
  price: string
  isNegotiable: boolean
  images: File[]
  contactPhone: string
  contactEmail: string
  
  // Custom fields
  brand?: string
  model?: string
  condition?: string
  warranty?: string
  year?: string
  mileage?: string
  transmission?: string
  fuel_type?: string
  color?: string
  bedrooms?: string
  bathrooms?: string
  furnishing?: string
  property_type?: string
  size_sqm?: string
  job_type?: string
  experience_level?: string
  salary_range?: string
  service_type?: string
  availability?: string
  experience_years?: string
  education_level?: string
  skills?: string
  desired_salary?: string
  
  // CV
  cv_file?: File
}

const STEPS = [
  { num: 1, label: 'Basic Info', desc: 'Category & Location' },
  { num: 2, label: 'Details', desc: 'Description & Pricing' },
  { num: 3, label: 'Review', desc: 'Images & Submit' }
]

export default function CreateAdClient() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    adType: 'product',
    title: '',
    description: '',
    category: '',
    subcategory: '',
    state: '',
    city: '',
    price: '',
    isNegotiable: false,
    images: [],
    contactPhone: '',
    contactEmail: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [subcategoryOptions, setSubcategoryOptions] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<string[]>([])

  // Update subcategories and ad type when category changes
  useEffect(() => {
    if (formData.category) {
      const category = getCategoryById(formData.category)
      setSelectedCategory(category)
      setSubcategoryOptions(getSubcategoryOptions(formData.category))
      setCustomFields(getCustomFieldsByCategoryId(formData.category))
      
      const categoryType = getCategoryType(formData.category)
      setFormData(prev => ({ 
        ...prev, 
        adType: categoryType,
        subcategory: '' 
      }))
    }
  }, [formData.category])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
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
      setFormData(prev => ({ ...prev, cv_file: file }))
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (stepNumber === 1) {
      if (!formData.category) newErrors.category = 'Category is required'
      if (!formData.subcategory) newErrors.subcategory = 'Subcategory is required'
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.state) newErrors.state = 'State is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
    }
    
    if (stepNumber === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (formData.adType === 'product' && !formData.price.trim()) {
        newErrors.price = 'Price is required'
      }
      if (formData.adType === 'cv' && !formData.cv_file) {
        newErrors.cv_file = 'Please upload your CV'
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
      
      // In production, this would upload to your backend
      console.log('Form Data:', formData)
      
      router.push('/?success=ad-created')
    } catch (error) {
      console.error('Error creating ad:', error)
      alert('Failed to create ad. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Post Your {formData.adType === 'cv' ? 'CV' : formData.adType === 'service' ? 'Service' : 'Ad'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {formData.adType === 'cv' 
                ? 'Share your professional profile and connect with employers'
                : formData.adType === 'service'
                  ? 'List your service and connect with clients'
                  : 'List your item and reach thousands of buyers'
              }
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
                      Publishing...
                    </>
                  ) : (
                    `Publish ${formData.adType === 'cv' ? 'CV' : formData.adType === 'service' ? 'Service' : 'Ad'}`
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
          By posting, you agree to our <a href="/terms" className="text-secondary hover:underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="text-secondary hover:underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  )
}
