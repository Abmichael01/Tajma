"use client"

import React from 'react'
import Image from 'next/image'
import { Column } from '@/components/admin/DataTable'
import type { AdminAd } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserFullName, getUserInitials } from '@/utils/user'

const getImageUrl = (image: string | undefined) => {
  if (!image) return null
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  if (image.startsWith('http')) return image
  if (image.startsWith('/media/')) return `${apiUrl}/api/media/${image.replace('/media/', '')}`
  if (image.startsWith('/')) return (image.includes('/ads/') ? `${apiUrl}/api/media/${image.replace(/^\//, '')}` : `${apiUrl}${image}`)
  return `${apiUrl}/api/media/${image}`
}

export const useAdTableColumns = (t: any, t_common: any): Column<AdminAd>[] => {
  return [
    {
      key: 'image',
      header: t('image'),
      render: (ad) => {
        const imageUrl = ad.images && ad.images.length > 0 ? getImageUrl(ad.images[0]) : null
        if (!imageUrl) return <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
        const isLocal = imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')
        return (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 relative">
            <Image src={imageUrl} alt={ad.title} width={48} height={48} className="w-full h-full object-cover" unoptimized={isLocal} />
          </div>
        )
      },
      width: '80px',
    },
    { key: 'title', header: t('title'), sortable: true, width: '25%' },
    {
      key: 'seller',
      header: t('seller'),
      render: (ad) => {
        const name = getUserFullName(ad.seller)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={ad.seller.avatar || undefined} alt={name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{getUserInitials(ad.seller)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col"><span className="text-sm font-medium">{name}</span><span className="text-xs text-gray-500">{ad.seller.email}</span></div>
          </div>
        )
      },
      sortable: true,
    },
    { key: 'category', header: t('category'), render: (ad) => ad.category_name || ad.category },
    {
      key: 'ad_type',
      header: t('type'),
      render: (ad) => <Badge variant="outline">{ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)}</Badge>,
    },
    {
      key: 'price',
      header: t('price'),
      render: (ad) => ad.price ? `${ad.currency} ${parseFloat(ad.price).toLocaleString()}` : t_common('contact_for_price'),
    },
    {
      key: 'status',
      header: t('status'),
      render: (ad) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { published: 'default', draft: 'secondary', archived: 'outline' }
        return <Badge variant={variants[ad.status] || 'outline'}>{ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}</Badge>
      },
    },
    { key: 'views', header: t('views'), sortable: true },
    { key: 'created_at', header: t('created_at'), render: (ad) => new Date(ad.created_at).toLocaleDateString(), sortable: true },
  ]
}
