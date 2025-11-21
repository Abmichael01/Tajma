"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Eye, 
  Heart,
  MessageSquare,
  TrendingUp, 
  Star,
  ShoppingBag,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'

interface ProfileOverviewProps {
  stats: {
    totalAds: number
    activeAds: number
    soldItems: number
    totalViews: number
    totalFavorites: number
    responseRate: number
    rating: number
    joinedDays: number
  }
  isOwner?: boolean
  userUid?: string
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle
}: {
  icon: typeof FileText
  label: string
  value: string | number
  subtitle?: string
}) => {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/30 bg-secondary/5 text-secondary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

export default function ProfileOverview({ stats, isOwner = false, userUid }: ProfileOverviewProps) {
  const primaryStats = [
    { icon: FileText, label: 'Total Ads', value: stats.totalAds.toLocaleString() },
    { icon: TrendingUp, label: 'Active Ads', value: stats.activeAds.toLocaleString() },
    { icon: Eye, label: 'Total Views', value: stats.totalViews.toLocaleString() },
    { icon: Star, label: 'Seller Rating', value: stats.rating.toFixed(1), subtitle: 'Out of 5.0' }
  ]

  const secondaryStats = [
    { icon: Heart, label: 'Favorites', value: stats.totalFavorites.toLocaleString() },
    { icon: CheckCircle, label: 'Sold Items', value: stats.soldItems.toLocaleString() },
    { icon: MessageSquare, label: 'Response Rate', value: `${stats.responseRate}%` },
    { icon: Clock, label: 'Days Active', value: stats.joinedDays.toLocaleString() }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {primaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {secondaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Performance Overview */}
      {isOwner && (
        <div className="border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/40 bg-secondary/10 text-secondary">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">Performance</h3>
                <p className="text-xs text-gray-500">Overview of your marketplace activity</p>
              </div>
            </div>
            <Link href={`/profile/${userUid}?tab=ads`}>
              <Button variant="ghost" size="sm" className="border border-gray-300 text-gray-700 hover:border-secondary hover:text-secondary">
                View All Ads
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-gray-200 bg-secondary/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Avg. Views per Ad</p>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {Math.round(stats.totalViews / (stats.totalAds || 1))}
              </p>
            </div>
            <div className="border border-gray-200 bg-secondary/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Avg. Favorites</p>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {Math.round(stats.totalFavorites / (stats.totalAds || 1))}
              </p>
            </div>
            <div className="border border-gray-200 bg-secondary/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Success Rate</p>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {Math.round((stats.soldItems / (stats.totalAds || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isOwner && (
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/create-ad">
              <Button variant="primary" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Post New Ad
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Messages
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="border border-secondary/30 bg-secondary/10 p-4">
        <h4 className="text-sm font-semibold text-secondary mb-2">
          {isOwner ? 'Your Performance' : 'Seller Performance'}
        </h4>
        <ul className="space-y-2 text-xs sm:text-sm text-secondary">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{stats.responseRate}% response rate to inquiries</span>
          </li>
          <li className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>{stats.rating}/5.0 average seller rating</span>
          </li>
          <li className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>{stats.soldItems} successful transactions</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
