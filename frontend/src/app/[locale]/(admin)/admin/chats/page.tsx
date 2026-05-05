"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useAdminChats, useDeleteAdminChat, useAdminStats } from '@/hooks/useAdmin'
import type { AdminChat } from '@/api/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { MessageSquare } from 'lucide-react'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

export default function AdminChatsPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const { data, isLoading } = useAdminChats({
    page,
    search: search || undefined,
  })

  const { data: stats } = useAdminStats()
  const deleteChat = useDeleteAdminChat()
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<AdminChat | null>(null)

  // Calculate stats
  const chatsStats = useMemo(() => {
    if (!stats) return null
    
    return {
      total: stats.total_chats || data?.count || 0,
    }
  }, [data, stats])

  const handleDelete = async (chat: AdminChat) => {
    setChatToDelete(chat)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!chatToDelete) return
    try {
      await deleteChat.mutateAsync(chatToDelete.id)
      setShowDeleteDialog(false)
      setChatToDelete(null)
    } catch (error) {
      // Error handled by mutation
    }
  }


  const columns: Column<AdminChat>[] = [
    {
      key: 'participant1',
      header: 'Participant 1',
      render: (chat) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={chat.participant1.avatar || undefined} alt={getUserFullName(chat.participant1)} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getUserInitials(chat.participant1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getUserFullName(chat.participant1)}</span>
            <span className="text-xs text-gray-500">{chat.participant1.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'participant2',
      header: 'Participant 2',
      render: (chat) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={chat.participant2.avatar || undefined} alt={getUserFullName(chat.participant2)} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getUserInitials(chat.participant2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getUserFullName(chat.participant2)}</span>
            <span className="text-xs text-gray-500">{chat.participant2.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'ad_title',
      header: 'Related Ad',
      render: (chat) => chat.ad_title || '-',
    },
    {
      key: 'message_count',
      header: 'Messages',
      sortable: true,
    },
    {
      key: 'last_message_at',
      header: 'Last Message',
      render: (chat) =>
        chat.last_message_at ? new Date(chat.last_message_at).toLocaleString() : '-',
      sortable: true,
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (chat) => new Date(chat.created_at).toLocaleDateString(),
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Chats</h1>
          <p className="text-gray-600 mt-1">Manage all chat conversations</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {chatsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard
            title="Total Chats"
            value={chatsStats.total.toLocaleString()}
            icon={MessageSquare}
            href="/admin/chats"
            isPrimary={true}
          />
        </div>
      )}

      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by participant email..."
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Chat Conversation?"
        description="Are you sure you want to delete this chat? All messages in this conversation will be permanently removed for both participants. This action cannot be undone."
        isLoading={deleteChat.isPending}
      />
    </div>
  )
}

