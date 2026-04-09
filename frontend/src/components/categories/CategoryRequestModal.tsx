"use client"

/**
 * CategoryRequestModal Component
 * 
 * Allows users to request new categories that don't exist yet.
 * This component will be used when users can't find an appropriate category.
 */

import React, { useState } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { requestCategory } from '@/services/categoryService'
import { CategoryType } from '@/types/category'
import { useCategories } from '@/hooks/useCategories'
import CategoryImage from '@/components/ui/CategoryImage'
import { useAuthStore } from '@/store/authStore'

interface CategoryRequestModalProps {
  isOpen: boolean
  onClose: () => void
  suggestedParentId?: string | null
}

export default function CategoryRequestModal({
  isOpen,
  onClose,
  suggestedParentId = null
}: CategoryRequestModalProps) {
  const { rootCategories } = useCategories()
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: suggestedParentId || '',
    type: 'product' as CategoryType,
    requestReason: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please describe what this category is for'
    }
    if (!formData.requestReason.trim()) {
      newErrors.requestReason = 'Please explain why you need this category'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      if (!user?.id) {
        setErrors({ submit: 'You must be logged in to request a category' })
        setIsSubmitting(false)
        return
      }

      await requestCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId || null,
        type: formData.type,
        requestedBy: String(user.id),
        requestReason: formData.requestReason.trim()
      })
      
      setIsSuccess(true)
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit request. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSuccess(false)
      setFormData({
        name: '',
        description: '',
        parentId: suggestedParentId || '',
        type: 'product',
        requestReason: ''
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request New Category"
      description="Can't find the right category? Request a new one and our team will review it."
      className="max-w-2xl"
    >
        <div className="py-2 overflow-y-auto max-h-[80vh] custom-scrollbar">
        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Request Submitted!
            </h3>
            <p className="text-gray-600">
              Your category request has been submitted. We'll review it and notify you once it's approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: '' })
                }}
                placeholder="e.g., Vintage Collectibles"
                className={errors.name ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (errors.description) setErrors({ ...errors, description: '' })
                }}
                placeholder="Briefly describe what items/services belong in this category"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Parent Category (Optional)
              </label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Main Category)</SelectItem>
                  {rootCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryImage 
                          imageUrl={cat.imageUrl} 
                          name={cat.name} 
                          size={24} 
                          className="w-6 h-6 rounded-md"
                        />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select if this should be a subcategory under an existing category
              </p>
            </div>

            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CategoryType })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="cv">CV / Job</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Request Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Why do you need this category? <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.requestReason}
                onChange={(e) => {
                  setFormData({ ...formData, requestReason: e.target.value })
                  if (errors.requestReason) setErrors({ ...errors, requestReason: '' })
                }}
                placeholder="Explain why this category is needed and how it would help you and other users"
                rows={4}
                className={errors.requestReason ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.requestReason && (
                <p className="text-red-500 text-sm mt-1">{errors.requestReason}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        )}
        </div>
    </ResponsiveModal>
  )
}

