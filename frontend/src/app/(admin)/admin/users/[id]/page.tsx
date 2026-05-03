"use client"

import React, { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminUser, useAdminAds } from '@/hooks/useAdmin'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import DataTable, { Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package, Eye, FileText } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { getUserFullName, getUserInitials } from '@/utils/user'
import type { AdminAd } from '@/api/admin'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = parseInt(params.id as string, 10)

  const { data: user, isLoading, error } = useAdminUser(userId)
  const [adsPage, setAdsPage] = useState(1)
  const [adsStatusFilter, setAdsStatusFilter] = useState<string | undefined>(undefined)
  
  const { data: adsData, isLoading: isLoadingAds } = useAdminAds({
    page: adsPage,
    seller: userId,
    status: adsStatusFilter,
  })

  // Helper function to get image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    
    if (image.startsWith('/media/')) {
      const path = image.replace('/media/', '')
      return `${apiUrl}/api/media/${path}`
    }
    
    if (image.startsWith('/')) {
      if (image.startsWith('/ads/') || image.includes('/ads/')) {
        const path = image.replace(/^\//, '')
        return `${apiUrl}/api/media/${path}`
      }
      return `${apiUrl}${image}`
    }
    
    return `${apiUrl}/api/media/${image}`
  }

  // Calculate stats from ads
  const userStats = useMemo(() => {
    if (!adsData?.results) return null
    
    const totalAds = adsData.count || 0
    const activeAds = adsData.results.filter(ad => ad.status === 'published').length
    const totalViews = adsData.results.reduce((sum, ad) => sum + (ad.views || 0), 0)
    
    return {
      totalAds,
      activeAds,
      totalViews,
    }
  }, [adsData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MarketplaceLoader size="md" message="Loading user details..." />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const userName = getUserFullName(user)
  const userInitials = getUserInitials(user)

  // Ads table columns
  const adsColumns: Column<AdminAd>[] = [
    {
      key: 'image',
      header: '',
      render: (ad) => {
        const imageUrl = getImageUrl(ad.images?.[0])
        const isLocalhost = imageUrl ? (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) : false
        return (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={ad.title}
                fill
                className="object-cover"
                unoptimized={isLocalhost}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>
        )
      },
      width: '80px',
    },
    {
      key: 'title',
      header: 'Title',
      render: (ad) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{ad.title}</span>
          <span className="text-xs text-gray-500">{ad.category_name || ad.category}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'price',
      header: 'Price',
      render: (ad) => (
        <span className="text-sm font-medium text-gray-900">
          {ad.price ? `${ad.currency} ${parseFloat(ad.price).toLocaleString()}` : 'Contact'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ad) => (
        <Badge
          variant={
            ad.status === 'published'
              ? 'default'
              : ad.status === 'draft'
              ? 'secondary'
              : 'outline'
          }
        >
          {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      render: (ad) => <span className="text-sm text-gray-600">{ad.views.toLocaleString()}</span>,
      sortable: true,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (ad) => (
        <span className="text-sm text-gray-600">
          {new Date(ad.created_at).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/users')}
          className="h-9 w-9"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-medium text-gray-900 truncate">{userName}</h1>
        </div>
      </div>

      {/* Statistics Row */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Ads"
            value={userStats.totalAds.toLocaleString()}
            icon={Package}
          />
          <AdminStatsCard
            title="Active Ads"
            value={userStats.activeAds.toLocaleString()}
            icon={FileText}
          />
          <AdminStatsCard
            title="Total Views"
            value={userStats.totalViews.toLocaleString()}
            icon={Eye}
          />
        </div>
      )}

      {/* User Details Sections */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Avatar</p>
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Email</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Username</p>
              <p className="text-sm font-medium text-gray-900">{user.username || '-'}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Full Name</p>
              <p className="text-sm font-medium text-gray-900">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : '-'}
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Is Seller</p>
              <Badge variant={user.is_seller ? 'default' : 'outline'}>
                {user.is_seller ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Is Staff</p>
              <Badge variant={user.is_staff ? 'default' : 'outline'}>
                {user.is_staff ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Is Active</p>
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Is Superuser</p>
              <Badge variant={user.is_superuser ? 'default' : 'outline'}>
                {user.is_superuser ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Timestamps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Date Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(user.date_joined).toLocaleString()}
              </p>
            </div>
            {user.last_login && (
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.last_login).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Ads */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">User Ads</h2>
            <Select
              value={adsStatusFilter || 'all'}
              onValueChange={(value) => setAdsStatusFilter(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={adsData?.results || []}
            columns={adsColumns}
            loading={isLoadingAds}
            onRowClick={(ad) => {
              router.push(`/admin/ads/${ad.id}`)
            }}
            pagination={
              adsData
                ? {
                    page: adsPage,
                    pageSize: 25,
                    total: adsData.count,
                    onPageChange: setAdsPage,
                  }
                : undefined
            }
            actions={(ad) => (
              <Link href={`/admin/ads/${ad.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  View
                </Button>
              </Link>
            )}
          />
        </div>
      </div>
    </div>
  )
}

