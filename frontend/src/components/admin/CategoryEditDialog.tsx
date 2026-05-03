"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import { useUpdateAdminCategory, useAdminCategories } from '@/hooks/useAdmin'
import type { AdminCategory } from '@/api/admin'

interface CategoryEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AdminCategory | null
  onSuccess?: () => void
}

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
  label?: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

export default function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryEditDialogProps) {
  const updateCategory = useUpdateAdminCategory()
  const { data: allCategoriesData } = useAdminCategories({ page: 1 })
  const allCategories = allCategoriesData?.results || []

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
    category_type: 'product' as 'product' | 'service' | 'job' | 'cv',
    image_url: '',
    sort_order: 0,
    is_active: true,
  })
  
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when category changes or dialog opens
  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id ?? null,
        category_type: category.category_type || 'product',
        image_url: category.image_url || '',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      })

      if (category.custom_fields && Array.isArray(category.custom_fields)) {
        setCustomFields(
          category.custom_fields.map((field: any, idx: number) => ({
            id: `field-${idx}-${Date.now()}`,
            name: field.name || '',
            type: field.type || 'text',
            label: field.label || '',
            placeholder: field.placeholder || '',
            required: field.required || false,
            options: field.options || [],
          }))
        )
      } else {
        setCustomFields([])
      }
      setErrors({})
    }
  }, [category, open])

  const handleUpdate = async () => {
    if (!category) return

    setErrors({})

    // Validate name
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    // Validate custom fields
    const fieldNames = new Set<string>()
    for (let i = 0; i < customFields.length; i++) {
      const field = customFields[i]
      if (!field.name.trim()) {
        setErrors({ custom_fields: `Field ${i + 1}: Name is required` })
        return
      }
      if (fieldNames.has(field.name.trim().toLowerCase())) {
        setErrors({ custom_fields: `Field ${i + 1}: Field name must be unique` })
        return
      }
      fieldNames.add(field.name.trim().toLowerCase())

      if (field.type === 'select') {
        const validOptions = field.options?.filter((opt) => String(opt || '').trim() !== '') || []
        if (validOptions.length === 0) {
          setErrors({
            custom_fields: `Field "${field.name}": Select fields must have at least one option`,
          })
          return
        }
      }
    }

    // Convert custom fields to JSON format
    const customFieldsParsed = customFields
      .map((field) => {
        const fieldDef: any = {
          name: field.name.trim(),
          type: field.type,
        }
        if (field.label) fieldDef.label = field.label.trim()
        if (field.placeholder) fieldDef.placeholder = field.placeholder.trim()
        if (field.required !== undefined) fieldDef.required = field.required
        if (field.type === 'select' && field.options && field.options.length > 0) {
          // Flatten options if they are objects (safeguard)
          fieldDef.options = field.options.map(opt => 
            typeof opt === 'object' && opt !== null ? ((opt as any).label || (opt as any).value || JSON.stringify(opt)) : opt
          ).filter((opt) => String(opt || '').trim() !== '')
        }
        return fieldDef
      })
      .filter((field) => field.name !== '')

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: {
          ...formData,
          custom_fields: customFieldsParsed,
        },
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      if (error?.response?.data) {
        const fieldErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach((key) => {
          const value = error.response.data[key]
          if (Array.isArray(value)) {
            fieldErrors[key] = value[0]
          } else if (typeof value === 'string') {
            fieldErrors[key] = value
          }
        })
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit Category: {category?.name}</DialogTitle>
          <DialogDescription>
            Update the category information and dynamic custom fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit_name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description"
              rows={3}
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="edit_parent_id">Parent Category</Label>
            <Select
              value={formData.parent_id?.toString() || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, parent_id: value === 'none' ? null : parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Category)</SelectItem>
                {allCategories
                  .filter((cat) => cat.id !== category?.id) // Prevent self-parenting
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Type */}
          <div className="space-y-2">
            <Label htmlFor="edit_category_type">
              Category Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category_type}
              onValueChange={(value: any) => setFormData({ ...formData, category_type: value })}
            >
              <SelectTrigger className={errors.category_type ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="cv">CV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Image */}
          <div className="space-y-2">
            <ImageUploader
              value={formData.image_url}
              onChange={(value) => setFormData({ ...formData, image_url: value || '' })}
              label="Category Image"
              maxSizeMB={5}
              aspectRatio="square"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="edit_sort_order">Sort Order</Label>
            <Input
              id="edit_sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit_is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
            />
            <Label htmlFor="edit_is_active" className="text-sm cursor-pointer">
              Active
            </Label>
          </div>

          {/* Custom Fields Builder */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Custom Fields</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Manage dynamic attributes for ads in this category
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomFields([
                    ...customFields,
                    {
                      id: Date.now().toString(),
                      name: '',
                      type: 'text',
                      label: '',
                      placeholder: '',
                      required: false,
                      options: [],
                    },
                  ])
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>

            {errors.custom_fields && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {errors.custom_fields}
              </p>
            )}

            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Field {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomFields(customFields.filter((f) => f.id !== field.id))}
                      className="text-red-500 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Field Name (ID) *</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => {
                          const updated = [...customFields]
                          updated[index].name = e.target.value
                          setCustomFields(updated)
                        }}
                        className="h-9"
                        placeholder="e.g. brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Field Type *</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: any) => {
                          const updated = [...customFields]
                          updated[index].type = value
                          setCustomFields(updated)
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`req-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => {
                        const updated = [...customFields]
                        updated[index].required = !!checked
                        setCustomFields(updated)
                      }}
                    />
                    <Label htmlFor={`req-${field.id}`} className="text-xs">Required</Label>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2 border-t pt-2">
                      <Label className="text-xs">Options</Label>
                      {(field.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <Input
                            value={typeof opt === 'object' && opt !== null ? ((opt as any).label || (opt as any).value || JSON.stringify(opt)) : opt}
                            onChange={(e) => {
                              const updated = [...customFields]
                              updated[index].options![optIdx] = e.target.value
                              setCustomFields(updated)
                            }}
                            className="h-8 flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = [...customFields]
                              updated[index].options = updated[index].options!.filter((_, i) => i !== optIdx)
                              setCustomFields(updated)
                            }}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => {
                          const updated = [...customFields]
                          updated[index].options = [...(updated[index].options || []), '']
                          setCustomFields(updated)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
            {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
