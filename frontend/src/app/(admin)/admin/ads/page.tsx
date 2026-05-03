"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useAdminAds, useUpdateAdminAd, useDeleteAdminAd, useAdminStats } from '@/hooks/useAdmin'
import type { AdminAd } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Package, FileText, Archive, CheckCircle, Eye } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

export default function AdminAdsPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get('status') || undefined
  )
  const [typeFilter, setTypeFilter] = useState<string | undefined>(
    searchParams.get('ad_type') || undefined
  )

  const { data, isLoading } = useAdminAds({
    page,
    search: search || undefined,
    status: statusFilter,
    ad_type: typeFilter,
  })

  const { data: stats } = useAdminStats()
  const updateAd = useUpdateAdminAd()
  const deleteAd = useDeleteAdminAd()
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [adToDelete, setAdToDelete] = useState<AdminAd | null>(null)

  // Calculate stats from current data
  const adsStats = useMemo(() => {
    if (!stats) return null
    
    return {
      total: stats.total_ads || 0,
      published: stats.active_ads || 0,
      draft: stats.draft_ads || 0,
      archived: stats.archived_ads || 0,
    }
  }, [stats])

  const handleStatusChange = async (ad: AdminAd, newStatus: string) => {
    try {
      // Validate status value
      const validStatuses = ['draft', 'published', 'archived']
      if (!validStatuses.includes(newStatus)) {
        toast.error(`Invalid status: ${newStatus}`)
        return
      }

      await updateAd.mutateAsync({
        id: ad.id,
        data: { status: newStatus as 'draft' | 'published' | 'archived' },
      })
    } catch (error: any) {
      // Error is already handled by mutation's onError, but log for debugging
      console.error('Failed to update ad status:', error)
      // The mutation's onError will show the toast
    }
  }

  const handleDelete = async (ad: AdminAd) => {
    setAdToDelete(ad)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!adToDelete) return
    try {
      await deleteAd.mutateAsync(adToDelete.id)
      setShowDeleteDialog(false)
      setAdToDelete(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

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

  // Helper function to get image URL
  // Uses API endpoint to bypass browser extension blocking
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    
    // If it's a /media/ path, convert to API endpoint
    if (image.startsWith('/media/')) {
      const path = image.replace('/media/', '')
      return `${apiUrl}/api/media/${path}`
    }
    
    // If it's just a path starting with /, use as is but try API endpoint
    if (image.startsWith('/')) {
      // Try API endpoint first (bypasses blockers)
      if (image.startsWith('/ads/') || image.includes('/ads/')) {
        const path = image.replace(/^\//, '')
        return `${apiUrl}/api/media/${path}`
      }
      return `${apiUrl}${image}`
    }
    
    // Relative path (e.g., 'ads/uuid.jpg'), use API endpoint
    return `${apiUrl}/api/media/${image}`
  }

  const columns: Column<AdminAd>[] = [
    {
      key: 'image',
      header: 'Image',
      render: (ad) => {
        const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null
        const imageUrl = firstImage ? getImageUrl(firstImage) : null
        
        if (!imageUrl) {
          return (
            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )
        }
        
        // Check if URL is from localhost (for unoptimized prop)
        const isLocalhost = imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')
        
        return (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 relative">
            <Image
              src={imageUrl}
              alt={ad.title}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized={isLocalhost}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.image-fallback') as HTMLElement
                if (fallback) {
                  fallback.classList.remove('hidden')
                }
              }}
            />
            <div className="w-12 h-12 bg-gray-100 rounded-md items-center justify-center hidden image-fallback absolute inset-0">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        )
      },
      width: '80px',
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '25%',
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (ad) => {
        const sellerName = getUserFullName(ad.seller)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={ad.seller.avatar || undefined} alt={sellerName} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getUserInitials(ad.seller)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{sellerName}</span>
              <span className="text-xs text-gray-500">{ad.seller.email}</span>
            </div>
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      render: (ad) => ad.category_name || ad.category,
    },
    {
      key: 'ad_type',
      header: 'Type',
      render: (ad) => (
        <Badge variant="outline">
          {ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)}
        </Badge>
      ),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Ads</h1>
          <p className="text-gray-600 mt-1">Manage all advertisements</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {adsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard
            title="Total Ads"
            value={adsStats.total.toLocaleString()}
            icon={Package}
            href="/admin/ads"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Published"
            value={adsStats.published.toLocaleString()}
            icon={CheckCircle}
            href="/admin/ads?status=published"
          />
          <AdminStatsCard
            title="Draft"
            value={adsStats.draft.toLocaleString()}
            icon={FileText}
            href="/admin/ads?status=draft"
          />
          <AdminStatsCard
            title="Archived"
            value={adsStats.archived.toLocaleString()}
            icon={Archive}
            href="/admin/ads?status=archived"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-fit min-w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter || 'all'}
            onValueChange={(value) => setTypeFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-fit min-w-[140px]">
              <SelectValue placeholder="Ad Type" />
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
        searchPlaceholder="Search by title or seller..."
        serverSide
        total={data?.count || 0}
        onParamsChange={(params) => {
          if (params.page !== page) setPage(params.page)
          if (params.search !== search) {
            setSearch(params.search)
            setPage(1)
          }
        }}
        onRowClick={(ad) => {
          window.location.href = `/admin/ads/${ad.id}`
        }}
        onDelete={handleDelete}
        pagination={{
            page,
            pageSize: 25,
        }}
        actions={(ad) => (
          <div className="flex items-center gap-2">
            <Link href={`/admin/ads/${ad.id}`}>
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="w-4 h-4 mr-1.5" />
                View
              </Button>
            </Link>
            <Select
              value={ad.status}
              onValueChange={(value) => handleStatusChange(ad, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title={`Delete Ad: ${adToDelete?.title}?`}
        description="Are you sure you want to delete this ad? This action cannot be undone and will remove the advertisement permanently from the marketplace."
        isLoading={deleteAd.isPending}
      />
    </div>
  )
}

