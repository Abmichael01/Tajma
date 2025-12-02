"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useAdminNotifications, useUpdateAdminNotification, useDeleteAdminNotification, useAdminStats } from '@/hooks/useAdmin'
import type { AdminNotification } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Bell, BellRing, CheckCircle, XCircle } from 'lucide-react'

export default function AdminNotificationsPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState<string | undefined>(
    searchParams.get('type') || undefined
  )
  const [isReadFilter, setIsReadFilter] = useState<string | undefined>(
    searchParams.get('is_read') || undefined
  )

  const { data, isLoading } = useAdminNotifications({
    page,
    search: search || undefined,
    type: typeFilter,
    is_read: isReadFilter ? isReadFilter === 'true' : undefined,
  })

  const { data: stats } = useAdminStats()
  const updateNotification = useUpdateAdminNotification()
  const deleteNotification = useDeleteAdminNotification()

  // Calculate stats
  const notificationsStats = useMemo(() => {
    if (!stats || !data?.results) return null
    
    const read = data.results.filter(notif => notif.is_read).length
    const unread = data.results.filter(notif => !notif.is_read).length
    
    return {
      total: stats.total_notifications || data.count || 0,
      read: isReadFilter === 'true' ? data.count : (isReadFilter === 'false' ? 0 : read),
      unread: isReadFilter === 'false' ? data.count : (isReadFilter === 'true' ? 0 : stats.unread_notifications || unread),
    }
  }, [data, stats, isReadFilter])

  const handleToggleRead = async (notification: AdminNotification) => {
    try {
      await updateNotification.mutateAsync({
        id: notification.id,
        data: { is_read: !notification.is_read },
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (notification: AdminNotification) => {
    if (!confirm(`Are you sure you want to delete this notification?`)) {
      return
    }
    try {
      await deleteNotification.mutateAsync(notification.id)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Helper function to get user initials safely
  const getUserInitials = (user?: { email?: string | null; username?: string | null }) => {
    if (user?.email && user.email.length > 0) {
      return user.email[0].toUpperCase()
    }
    if (user?.username && user.username.length > 0) {
      return user.username[0].toUpperCase()
    }
    return '?'
  }

  const columns: Column<AdminNotification>[] = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (notification) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={notification.recipient?.avatar || undefined}
              alt={notification.recipient?.email || 'User'}
            />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getUserInitials(notification.recipient)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{notification.recipient?.email || 'Unknown user'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '25%',
    },
    {
      key: 'type',
      header: 'Type',
      render: (notification) => (
        <Badge variant="outline">{notification.type}</Badge>
      ),
    },
    {
      key: 'is_read',
      header: 'Status',
      render: (notification) => (
        <Badge variant={notification.is_read ? 'default' : 'secondary'}>
          {notification.is_read ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Recent',
      render: (notification) => {
        const date = new Date(notification.created_at)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
      },
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Manage all notifications</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {notificationsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Notifications"
            value={notificationsStats.total.toLocaleString()}
            icon={Bell}
            href="/admin/notifications"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Read"
            value={notificationsStats.read.toLocaleString()}
            icon={CheckCircle}
            href="/admin/notifications?is_read=true"
          />
          <AdminStatsCard
            title="Unread"
            value={notificationsStats.unread.toLocaleString()}
            icon={BellRing}
            href="/admin/notifications?is_read=false"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={isReadFilter || 'all'}
            onValueChange={(value) => setIsReadFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Read Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Read</SelectItem>
              <SelectItem value="false">Unread</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter || 'all'}
            onValueChange={(value) => setTypeFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="phone_view">Phone View</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="ad_view">Ad View</SelectItem>
              <SelectItem value="favorite">Favorite</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="ad_status">Ad Status</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by recipient or title..."
        onSearch={setSearch}
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
        actions={(notification) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleRead(notification)
            }}
            className="text-sm text-secondary hover:underline"
          >
            {notification.is_read ? 'Mark Unread' : 'Mark Read'}
          </button>
        )}
      />
    </div>
  )
}

