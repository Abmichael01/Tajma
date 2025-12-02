"use client"

import React from 'react'
import { ArrowUpRight, TrendingUp } from 'lucide-react'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminStats } from '@/hooks/useAdmin'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MarketplaceLoader size="md" message="Loading dashboard..." />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard statistics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your marketplace</p>
      </div>

      {/* Statistics Cards - Only 4 stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          icon={ArrowUpRight}
          href="/admin/users"
          isPrimary={true}
          percentage={12.5}
          period="vs last month"
        />
        <AdminStatsCard
          title="Total Ads"
          value={stats.total_ads.toLocaleString()}
          icon={ArrowUpRight}
          href="/admin/ads"
          percentage={8.3}
          period="vs last month"
        />
        <AdminStatsCard
          title="Active Ads"
          value={stats.active_ads.toLocaleString()}
          icon={ArrowUpRight}
          href="/admin/ads?status=published"
          percentage={-2.1}
          period="vs last month"
        />
        <AdminStatsCard
          title="Total Messages"
          value={stats.total_messages.toLocaleString()}
          icon={ArrowUpRight}
          href="/admin/messages"
          percentage={15.7}
          period="vs last month"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-medium text-gray-900">Recent Activity (Last 24 Hours)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1.5">New Users</p>
            <p className="text-2xl font-medium text-gray-900">
              {stats.recent_activity_24h.new_users}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1.5">New Ads</p>
            <p className="text-2xl font-medium text-gray-900">
              {stats.recent_activity_24h.new_ads}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1.5">New Messages</p>
            <p className="text-2xl font-medium text-gray-900">
              {stats.recent_activity_24h.new_messages}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
