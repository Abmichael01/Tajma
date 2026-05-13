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
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { useTranslations } from 'next-intl'

export default function AdminMessagesPage() {
  const t = useTranslations('admin.messages')
  const t_table = useTranslations('admin.messages.table')
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isReadFilter, setIsReadFilter] = useState<string | undefined>(searchParams.get('is_read') || undefined)

  const { data, isLoading } = useAdminMessages({ page, search: search || undefined, is_read: isReadFilter ? isReadFilter === 'true' : undefined })
  const { data: stats } = useAdminStats()
  const deleteMessage = useDeleteAdminMessage()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<AdminMessage | null>(null)

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

  const columns: Column<AdminMessage>[] = [
    { key: 'chat', header: t_table('chat_id'), render: (m) => m.chat.substring(0, 8) + '...' },
    {
      key: 'sender',
      header: t_table('sender'),
      render: (m) => {
        const name = getUserFullName(m.sender)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6"><AvatarImage src={m.sender.avatar || undefined} alt={name} /><AvatarFallback className="text-xs bg-primary/10 text-primary">{getUserInitials(m.sender)}</AvatarFallback></Avatar>
            <div className="flex flex-col"><span className="text-sm font-medium">{name}</span><span className="text-xs text-gray-500">{m.sender.email}</span></div>
          </div>
        )
      },
      sortable: true,
    },
    { key: 'content', header: t_table('content'), render: (m) => <div className="max-w-md truncate">{m.content || '-'}</div>, width: '40%' },
    { key: 'is_read', header: t_table('status'), render: (m) => <Badge variant={m.is_read ? 'default' : 'secondary'}>{m.is_read ? t('read') : t('unread')}</Badge> },
    { key: 'created_at', header: t_table('created_at'), render: (m) => new Date(m.created_at).toLocaleString(), sortable: true },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium text-gray-900">{t('title')}</h1><p className="text-gray-600 mt-1">{t('description')}</p></div>

      {messagesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard title={t('total_messages')} value={messagesStats.total.toLocaleString()} icon={MessageSquare} href="/admin/messages" isPrimary />
          <AdminStatsCard title={t('read')} value={messagesStats.read.toLocaleString()} icon={CheckCircle} href="/admin/messages?is_read=true" />
          <AdminStatsCard title={t('unread')} value={messagesStats.unread.toLocaleString()} icon={Circle} href="/admin/messages?is_read=false" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <Select value={isReadFilter || 'all'} onValueChange={(v) => setIsReadFilter(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t('read_status_placeholder')} /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t('all')}</SelectItem><SelectItem value="true">{t('read')}</SelectItem><SelectItem value="false">{t('unread')}</SelectItem></SelectContent>
        </Select>
      </div>

      <DataTable
        data={data?.results || []} columns={columns} loading={isLoading} searchable searchPlaceholder={t('search_placeholder')}
        serverSide total={data?.count || 0}
        onParamsChange={(p) => { if (p.page !== page) setPage(p.page); if (p.search !== search) { setSearch(p.search); setPage(1) } }}
        onDelete={(m) => { setMessageToDelete(m); setShowDeleteDialog(true) }}
        pagination={{ page, pageSize: 25 }}
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={async () => { if (messageToDelete) { await deleteMessage.mutateAsync(messageToDelete.id); setShowDeleteDialog(false) } }}
        title={t('delete_title')} description={t('delete_desc')} isLoading={deleteMessage.isPending}
      />
    </div>
  )
}
