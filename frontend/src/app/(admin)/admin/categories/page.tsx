"use client"

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable, { Column } from '@/components/admin/DataTable'
import {
  useAdminCategories,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useDeleteAdminCategory,
} from '@/hooks/useAdmin'
import type { AdminCategory } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, FolderTree, CheckCircle, XCircle, Eye, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminStats } from '@/hooks/useAdmin'
import { useMemo } from 'react'
import ImageUploader from '@/components/ui/ImageUploader'
import CategoryEditDialog from '@/components/admin/CategoryEditDialog'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

export default function AdminCategoriesPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(
    searchParams.get('is_active') || undefined
  )
  const [typeFilter, setTypeFilter] = useState<string | undefined>(
    searchParams.get('category_type') || undefined
  )

  const { data, isLoading } = useAdminCategories({
    page,
    search: search || undefined,
    is_active: isActiveFilter ? isActiveFilter === 'true' : undefined,
    category_type: typeFilter,
  })

  const { data: stats } = useAdminStats()
  const createCategory = useCreateAdminCategory()
  const updateCategory = useUpdateAdminCategory()
  const deleteCategory = useDeleteAdminCategory()

  // Category creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
    category_type: 'product' as 'product' | 'service' | 'job' | 'cv',
    icon: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
    custom_fields: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Custom fields builder state (for creation)
  interface CustomField {
    id: string
    name: string
    type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
    label?: string
    placeholder?: string
    required?: boolean
    options?: string[] // For select type
  }
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  // Fetch all categories for parent selection (without pagination)
  const { data: allCategoriesData } = useAdminCategories({ page: 1 })
  const allCategories = allCategoriesData?.results || []

  // Calculate stats
  const categoriesStats = useMemo(() => {
    if (!stats || !data?.results) return null
    
    const active = data.results.filter(cat => cat.is_active).length
    const inactive = data.results.filter(cat => !cat.is_active).length
    
    return {
      total: stats.total_categories || data.count || 0,
      active: isActiveFilter === 'true' ? data.count : (isActiveFilter === 'false' ? 0 : stats.active_categories || active),
      inactive: isActiveFilter === 'false' ? data.count : (isActiveFilter === 'true' ? 0 : inactive),
    }
  }, [data, stats, isActiveFilter])

  const handleToggleActive = async (category: AdminCategory) => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: { is_active: !category.is_active },
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (category: AdminCategory) => {
    setCategoryToDelete(category)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id)
      setShowDeleteDialog(false)
      setCategoryToDelete(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCreateCategory = async () => {
    // Reset errors
    setErrors({})

    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    if (!formData.category_type) {
      setErrors({ category_type: 'Category type is required' })
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
        const validOptions = field.options?.filter(opt => opt.trim() !== '') || []
        if (validOptions.length === 0) {
          setErrors({ custom_fields: `Field "${field.name}": Select fields must have at least one option` })
          return
        }
      }
    }

    // Convert custom fields to JSON format
    const customFieldsParsed = customFields.map((field) => {
      const fieldDef: any = {
        name: field.name.trim(),
        type: field.type,
      }
      if (field.label) fieldDef.label = field.label.trim()
      if (field.placeholder) fieldDef.placeholder = field.placeholder.trim()
      if (field.required !== undefined) fieldDef.required = field.required
      if (field.type === 'select' && field.options && field.options.length > 0) {
        fieldDef.options = field.options.filter(opt => opt.trim() !== '')
      }
      return fieldDef
    }).filter(field => field.name !== '') // Remove fields without names

    try {
      await createCategory.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parent_id: formData.parent_id || undefined,
        category_type: formData.category_type,
        icon: formData.icon.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        custom_fields: customFieldsParsed.length > 0 ? customFieldsParsed : undefined,
      })
      setShowCreateModal(false)
      // Reset form
      setFormData({
        name: '',
        description: '',
        parent_id: null,
        category_type: 'product',
        icon: '',
        image_url: '',
        sort_order: 0,
        is_active: true,
        custom_fields: '',
      })
      setCustomFields([])
    } catch (error: any) {
      // Error handled by mutation, but we can also set field-specific errors
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

  const handleOpenEditModal = (category: AdminCategory) => {
    setEditingCategory(category)
    setShowEditModal(true)
  }

  const columns: Column<AdminCategory>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'slug',
      header: 'Slug',
      sortable: true,
    },
    {
      key: 'parent_name',
      header: 'Parent',
      render: (category) => category.parent_name || '-',
    },
    {
      key: 'category_type',
      header: 'Type',
      render: (category) => (
        <Badge variant="outline">
          {category.category_type.charAt(0).toUpperCase() + category.category_type.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (category) => (
        <Badge variant={category.is_active ? 'default' : 'destructive'}>
          {category.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'sort_order',
      header: 'Sort Order',
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage all categories</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Statistics Cards */}
      {categoriesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Categories"
            value={categoriesStats.total.toLocaleString()}
            icon={FolderTree}
            href="/admin/categories"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Active"
            value={categoriesStats.active.toLocaleString()}
            icon={CheckCircle}
            href="/admin/categories?is_active=true"
          />
          <AdminStatsCard
            title="Inactive"
            value={categoriesStats.inactive.toLocaleString()}
            icon={XCircle}
            href="/admin/categories?is_active=false"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={isActiveFilter || 'all'}
            onValueChange={(value) => setIsActiveFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter || 'all'}
            onValueChange={(value) => setTypeFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="job">Job</SelectItem>
              <SelectItem value="cv">CV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by name or slug..."
        serverSide
        total={data?.count || 0}
        onParamsChange={(params) => {
          if (params.page !== page) setPage(params.page)
          if (params.search !== search) {
            setSearch(params.search)
            setPage(1)
          }
        }}
        onRowClick={(category) => {
          window.location.href = `/admin/categories/${category.id}`
        }}
        onDelete={handleDelete}
        pagination={{
            page,
            pageSize: 25,
        }}
        actions={(category) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/admin/categories/${category.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-gray-200 hover:border-gray-300"
                  >
                    <Eye className="w-4 h-4" />
              </Button>
            </Link>
              </TooltipTrigger>
              <TooltipContent side="top">View details</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
            <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 border border-gray-200 hover:border-gray-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEditModal(category)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit category</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 border border-gray-200 hover:border-gray-300"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleActive(category)
              }}
            >
                  {category.is_active ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
            </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {category.is_active ? 'Deactivate category' : 'Activate category'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      />

      {/* Create Category Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to the system. Fill in the required fields below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
                rows={3}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category</Label>
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
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Type */}
            <div className="space-y-2">
              <Label htmlFor="category_type">
                Category Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category_type}
                onValueChange={(value: 'product' | 'service' | 'job' | 'cv') =>
                  setFormData({ ...formData, category_type: value })
                }
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
              {errors.category_type && (
                <p className="text-sm text-red-600">{errors.category_type}</p>
              )}
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
              <p className="text-xs text-gray-500">
                Upload an image for this category. If no image is provided, a skeleton placeholder will be shown.
              </p>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                }
                min="0"
              />
            </div>

            {/* Custom Fields Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom Fields</Label>
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
              <p className="text-xs text-gray-500">
                Add custom fields that will appear when creating ads in this category
              </p>
              {errors.custom_fields && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {errors.custom_fields}
                </p>
              )}

              {customFields.length === 0 && (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500">No custom fields added yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Add Field" to create custom fields for this category
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Field {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomFields(customFields.filter((f) => f.id !== field.id))
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Field Name */}
                      <div className="space-y-1">
                        <Label className="text-xs">Field Name *</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => {
                            const updated = [...customFields]
                            updated[index].name = e.target.value
                            setCustomFields(updated)
                            // Clear error when user starts editing
                            if (errors.custom_fields) {
                              setErrors({ ...errors, custom_fields: '' })
                            }
                          }}
                          placeholder="e.g., brand, color, size"
                          className="h-9"
                        />
                      </div>

                      {/* Field Type */}
                      <div className="space-y-1">
                        <Label className="text-xs">Field Type *</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: CustomField['type']) => {
                            const updated = [...customFields]
                            updated[index].type = value
                            if (value === 'select' && !updated[index].options) {
                              updated[index].options = []
                            }
                            setCustomFields(updated)
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Select (Dropdown)</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="textarea">Text Area</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Label */}
                      <div className="space-y-1">
                        <Label className="text-xs">Display Label</Label>
                        <Input
                          value={field.label || ''}
                          onChange={(e) => {
                            const updated = [...customFields]
                            updated[index].label = e.target.value
                            setCustomFields(updated)
                          }}
                          placeholder="e.g., Brand Name"
                          className="h-9"
                        />
                      </div>

                      {/* Placeholder */}
                      <div className="space-y-1">
                        <Label className="text-xs">Placeholder Text</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => {
                            const updated = [...customFields]
                            updated[index].placeholder = e.target.value
                            setCustomFields(updated)
                          }}
                          placeholder="e.g., Enter brand name"
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required || false}
                        onCheckedChange={(checked) => {
                          const updated = [...customFields]
                          updated[index].required = checked === true
                          setCustomFields(updated)
                        }}
                      />
                      <Label
                        htmlFor={`required-${field.id}`}
                        className="text-xs cursor-pointer"
                      >
                        Required field
                      </Label>
                    </div>

                    {/* Options for Select Type */}
                    {field.type === 'select' && (
                      <div className="space-y-2 border-t pt-3">
                        <Label className="text-xs">Options *</Label>
                        <p className="text-xs text-gray-500">
                          Add options for the dropdown (one per line or comma-separated)
                        </p>
                        <div className="space-y-2">
                          {(field.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                                <Input
                                  value={typeof option === 'object' && option !== null ? ((option as any).label || (option as any).value || JSON.stringify(option)) : option}
                                  onChange={(e) => {
                                    const updated = [...customFields]
                                    if (!updated[index].options) {
                                      updated[index].options = []
                                    }
                                    updated[index].options![optIndex] = e.target.value
                                    setCustomFields(updated)
                                  }}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="h-9 flex-1"
                                />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = [...customFields]
                                  if (updated[index].options) {
                                    updated[index].options = updated[index].options!.filter(
                                      (_, i) => i !== optIndex
                                    )
                                  }
                                  setCustomFields(updated)
                                }}
                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = [...customFields]
                              if (!updated[index].options) {
                                updated[index].options = []
                              }
                              updated[index].options!.push('')
                              setCustomFields(updated)
                            }}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        {(!field.options || field.options.length === 0 || field.options.every(opt => !String(opt || '').trim())) && (
                          <p className="text-xs text-amber-600">
                            At least one option is required for select fields
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked === true })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible to users)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setErrors({})
                setCustomFields([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <CategoryEditDialog
        open={showEditModal}
        onOpenChange={setShowEditModal}
        category={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title={`Delete Category: ${categoryToDelete?.name}?`}
        description="Are you sure you want to delete this category? This will also remove all associations, but it will fail if there are ads currently in this category."
        isLoading={deleteCategory.isPending}
      />
    </div>
  )
}
