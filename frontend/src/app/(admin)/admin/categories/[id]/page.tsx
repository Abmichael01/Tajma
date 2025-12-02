"use client"

import React, { useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAdminCategory, useAdminAds } from '@/hooks/useAdmin'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import DataTable, { Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, CheckCircle, XCircle } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import type { AdminAd } from '@/api/admin'

export default function AdminCategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = parseInt(params.id as string, 10)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const { data: category, isLoading, error } = useAdminCategory(categoryId)
  const { data: adsData, isLoading: isLoadingAds } = useAdminAds({
    page,
    category: category?.slug,
  })

  // Calculate stats from ads data
  const categoryStats = useMemo(() => {
    if (!adsData?.results) return null

    const total = adsData.count || 0
    const published = adsData.results.filter((ad) => ad.status === 'published').length
    const draft = adsData.results.filter((ad) => ad.status === 'draft').length
    const archived = adsData.results.filter((ad) => ad.status === 'archived').length

    return {
      total,
      published: total > 0 && adsData.results.length < total ? total : published,
      draft,
      archived,
    }
  }, [adsData])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const columns: Column<AdminAd>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '30%',
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (ad) => ad.seller.email,
      sortable: true,
    },
    {
      key: 'price',
      header: 'Price',
      render: (ad) =>
        ad.price ? `${ad.currency} ${parseFloat(ad.price).toLocaleString()}` : 'Contact for price',
    },
    {
      key: 'status',
      header: 'Status',
      render: (ad) => getStatusBadge(ad.status),
    },
    {
      key: 'views',
      header: 'Views',
      sortable: true,
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (ad) => new Date(ad.created_at).toLocaleDateString(),
      sortable: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MarketplaceLoader size="md" message="Loading category details..." />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">
            The category you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/categories')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/categories')}
          className="h-9 w-9"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-medium text-gray-900 truncate">{category.name}</h1>
        </div>
      </div>

      {/* Statistics Row */}
      {categoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Ads"
            value={categoryStats.total.toLocaleString()}
            icon={Package}
          />
          <AdminStatsCard
            title="Published"
            value={categoryStats.published.toLocaleString()}
            icon={CheckCircle}
          />
          <AdminStatsCard
            title="Draft"
            value={categoryStats.draft.toLocaleString()}
            icon={XCircle}
          />
        </div>
      )}

      {/* Category Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-medium text-gray-900 mb-4">Category Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Name</p>
            <p className="text-base font-medium text-gray-900">{category.name}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Slug</p>
            <p className="text-base font-medium text-gray-900 font-mono text-sm">
              {category.slug}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Type</p>
            <Badge variant="outline">
              {category.category_type.charAt(0).toUpperCase() + category.category_type.slice(1)}
            </Badge>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Status</p>
            <Badge variant={category.is_active ? 'default' : 'destructive'}>
              {category.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {category.parent_name && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Parent Category</p>
              <p className="text-base font-medium text-gray-900">{category.parent_name}</p>
            </div>
          )}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Sort Order</p>
            <p className="text-base font-medium text-gray-900">{category.sort_order}</p>
          </div>
        </div>
      </div>

      {/* Ads List Table */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-4">Ads in this Category</h2>
        <DataTable
          data={adsData?.results || []}
          columns={columns}
          loading={isLoadingAds}
          searchable={false}
          onEdit={(ad) => {
            router.push(`/admin/ads/${ad.id}`)
          }}
          pagination={
            adsData
              ? {
                  page,
                  pageSize: 25,
                  total: adsData.count,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}

