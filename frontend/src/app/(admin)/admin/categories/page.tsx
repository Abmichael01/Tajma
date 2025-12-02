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
import { Plus, FolderTree, CheckCircle, XCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminStats } from '@/hooks/useAdmin'
import { useMemo } from 'react'

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
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return
    }
    try {
      await deleteCategory.mutateAsync(category.id)
    } catch (error) {
      // Error handled by mutation
    }
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
        <Button onClick={() => toast.info('Create category functionality coming soon')}>
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
      <div className="bg-white border border-gray-200 rounded-lg p-4">
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
        onSearch={setSearch}
        onRowClick={(category) => {
          window.location.href = `/admin/categories/${category.id}`
        }}
        onDelete={handleDelete}
        pagination={
          data
            ? {
                page,
                pageSize: 25,
                total: data.count,
                onPageChange: setPage,
              }
            : undefined
        }
        actions={(category) => (
          <div className="flex items-center gap-2">
            <Link href={`/admin/categories/${category.id}`}>
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="w-4 h-4 mr-1.5" />
                View
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleActive(category)
              }}
              className="h-8"
            >
              {category.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      />
    </div>
  )
}

