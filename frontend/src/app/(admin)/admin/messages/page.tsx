"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useAdminMessages, useDeleteAdminMessage, useAdminStats } from '@/hooks/useAdmin'
import type { AdminMessage } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { MessageSquare, CheckCircle, Circle } from 'lucide-react'
import { getUserFullName, getUserInitials } from '@/utils/user'

export default function AdminMessagesPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isReadFilter, setIsReadFilter] = useState<string | undefined>(
    searchParams.get('is_read') || undefined
  )

  const { data, isLoading } = useAdminMessages({
    page,
    search: search || undefined,
    is_read: isReadFilter ? isReadFilter === 'true' : undefined,
  })

  const { data: stats } = useAdminStats()
  const deleteMessage = useDeleteAdminMessage()

  // Calculate stats
  const messagesStats = useMemo(() => {
    if (!stats || !data?.results) return null
    
    const read = data.results.filter(msg => msg.is_read).length
    const unread = data.results.filter(msg => !msg.is_read).length
    
    return {
      total: stats.total_messages || data.count || 0,
      read: isReadFilter === 'true' ? data.count : (isReadFilter === 'false' ? 0 : read),
      unread: isReadFilter === 'false' ? data.count : (isReadFilter === 'true' ? 0 : unread),
    }
  }, [data, stats, isReadFilter])

  const handleDelete = async (message: AdminMessage) => {
    if (!confirm(`Are you sure you want to delete this message?`)) {
      return
    }
    try {
      await deleteMessage.mutateAsync(message.id)
    } catch (error) {
      // Error handled by mutation
    }
  }


  const columns: Column<AdminMessage>[] = [
    {
      key: 'chat',
      header: 'Chat ID',
      render: (message) => message.chat.substring(0, 8) + '...',
    },
    {
      key: 'sender',
      header: 'Sender',
      render: (message) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={message.sender.avatar || undefined} alt={getUserFullName(message.sender)} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getUserInitials(message.sender)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getUserFullName(message.sender)}</span>
            <span className="text-xs text-gray-500">{message.sender.email}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'content',
      header: 'Content',
      render: (message) => (
        <div className="max-w-md truncate">{message.content || '-'}</div>
      ),
      width: '40%',
    },
    {
      key: 'is_read',
      header: 'Status',
      render: (message) => (
        <Badge variant={message.is_read ? 'default' : 'secondary'}>
          {message.is_read ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (message) => new Date(message.created_at).toLocaleString(),
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Manage all messages</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {messagesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Messages"
            value={messagesStats.total.toLocaleString()}
            icon={MessageSquare}
            href="/admin/messages"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Read"
            value={messagesStats.read.toLocaleString()}
            icon={CheckCircle}
            href="/admin/messages?is_read=true"
          />
          <AdminStatsCard
            title="Unread"
            value={messagesStats.unread.toLocaleString()}
            icon={Circle}
            href="/admin/messages?is_read=false"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Select
          value={isReadFilter || 'all'}
          onValueChange={(value) => setIsReadFilter(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Read Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Read</SelectItem>
            <SelectItem value="false">Unread</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by content or sender..."
        serverSide
        total={data?.count || 0}
        onParamsChange={(params) => {
          if (params.page !== page) setPage(params.page)
          if (params.search !== search) {
            setSearch(params.search)
            setPage(1)
          }
        }}
        onDelete={handleDelete}
        pagination={{
            page,
            pageSize: 25,
        }}
      />
    </div>
  )
}

