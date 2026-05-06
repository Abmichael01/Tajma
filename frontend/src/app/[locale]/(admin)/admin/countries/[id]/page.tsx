"use client"

import React, { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { useLocationDetail } from '@/hooks/useLocations'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import DataTable, { Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, CheckCircle, XCircle } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { getUserFullName } from '@/utils/user'
import { Link } from '@/i18n/routing'

export default function AdminLocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const countrySlug = params.id as string
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const { data: country, isLoading, error } = useLocationDetail(countrySlug)

  // Calculate stats from region data
  const countryStats = useMemo(() => {
    if (!country) return null

    const ads = country.ads || []
    const total = ads.length
    const published = ads.filter((ad: any) => ad.status === 'published').length
    const draft = ads.filter((ad: any) => ad.status === 'draft').length
    const archived = ads.filter((ad: any) => ad.status === 'archived').length

    return {
      total,
      published,
      draft,
      archived,
    }
  }, [country])

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

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '30%',
      render: (ad) => (
        <Link href={`/admin/ads/${ad.slug}`} className="text-blue-600 hover:underline">
          {ad.title}
        </Link>
      ),
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (ad) => getUserFullName(ad.seller),
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
        <MarketplaceLoader size="md" message="Loading region details..." />
      </div>
    )
  }

  if (error || !country) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">Failed to load country details</p>
        <Button variant="outline" onClick={() => router.push('/admin/countries')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Countries
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/countries')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium text-gray-900">{country.name}</h1>
            <p className="text-gray-600 mt-1">Country Details</p>
          </div>
        </div>
        <Badge variant={country.is_active ? 'default' : 'destructive'}>
          {country.is_active ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      </div>

      {/* Statistics Cards - Moved First */}
      {countryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard
            title="Total Ads"
            value={countryStats.total.toLocaleString()}
            icon={MapPin}
            isPrimary={true}
          />
          <AdminStatsCard
            title="Published"
            value={countryStats.published.toLocaleString()}
            icon={CheckCircle}
          />
          <AdminStatsCard
            title="Draft"
            value={countryStats.draft.toLocaleString()}
            icon={XCircle}
          />
          <AdminStatsCard
            title="Archived"
            value={countryStats.archived.toLocaleString()}
            icon={XCircle}
          />
        </div>
      )}

      {/* Location Info - Each item in container with border and rounded */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Country Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Name</p>
            <p className="text-base font-medium">{country.name}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Slug</p>
            <p className="text-base font-medium">{country.slug}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Sort Order</p>
            <p className="text-base font-medium">{country.sort_order}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-base font-medium">{country.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Ads in this Country</h2>
        </div>
        <DataTable
          data={country.ads || []}
          columns={columns}
          loading={false}
        />
      </div>
    </div>
  )
}

