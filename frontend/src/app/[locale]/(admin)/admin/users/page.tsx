"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser, useAdminStats } from '@/hooks/useAdmin'
import type { AdminUser } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Users, UserCheck, Store, Shield, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import { getUserFullName } from '@/utils/user'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { useTranslations } from 'next-intl'
import { useUserTableColumns } from '@/components/admin/users/UserTableColumns'

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const t_table = useTranslations('admin.users.table')
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(searchParams.get('is_active') || undefined)
  const [isSellerFilter, setIsSellerFilter] = useState<string | undefined>(searchParams.get('is_seller') || undefined)
  const [isStaffFilter, setIsStaffFilter] = useState<string | undefined>(searchParams.get('is_staff') || undefined)

  const { data, isLoading } = useAdminUsers({
    page,
    search: search || undefined,
    is_active: isActiveFilter ? isActiveFilter === 'true' : undefined,
    is_seller: isSellerFilter ? isSellerFilter === 'true' : undefined,
    is_staff: isStaffFilter ? isStaffFilter === 'true' : undefined,
  })

  const { data: stats } = useAdminStats()
  const updateUser = useUpdateAdminUser()
  const deleteUser = useDeleteAdminUser()
  const { user: currentUser } = useAuthStore()
  
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [showSelfDeactivateDialog, setShowSelfDeactivateDialog] = useState(false)
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  const usersStats = useMemo(() => {
    if (!stats) return null
    const activeCount = data?.results?.filter(user => user.is_active).length || 0
    const sellersCount = data?.results?.filter(user => user.is_seller).length || 0
    const staffCount = data?.results?.filter(user => user.is_staff).length || 0
    
    return {
      total: stats.total_users || 0,
      active: isActiveFilter === 'true' ? (data?.count || 0) : (isActiveFilter === 'false' ? (data?.count || 0) : activeCount),
      sellers: isSellerFilter === 'true' ? (data?.count || 0) : (isSellerFilter === 'false' ? (data?.count || 0) : sellersCount),
      staff: isStaffFilter === 'true' ? (data?.count || 0) : (isStaffFilter === 'false' ? (data?.count || 0) : staffCount),
    }
  }, [data, stats, isActiveFilter, isSellerFilter, isStaffFilter])

  const handleToggleActive = async (user: AdminUser) => {
    if (currentUser && currentUser.id === user.id && user.is_active) {
      setPendingUser(user); setShowSelfDeactivateDialog(true); return
    }
    setUpdatingUserId(user.id)
    try {
      await updateUser.mutateAsync({ id: user.id, data: { is_active: !user.is_active } })
    } finally { setUpdatingUserId(null) }
  }
  
  const handleConfirmSelfDeactivate = async () => {
    if (!pendingUser) return
    setUpdatingUserId(pendingUser.id); setShowSelfDeactivateDialog(false)
    try {
      await updateUser.mutateAsync({ id: pendingUser.id, data: { is_active: false } })
      toast.warning(t('self_deactivated_toast'))
    } finally { setUpdatingUserId(null); setPendingUser(null) }
  }

  const columns = useUserTableColumns(t_table)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('description')}</p>
      </div>

      {usersStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard title={t('total_users')} value={usersStats.total.toLocaleString()} icon={Users} href="/admin/users" isPrimary />
          <AdminStatsCard title={t('active_users')} value={usersStats.active.toLocaleString()} icon={UserCheck} href="/admin/users?is_active=true" isPrimary />
          <AdminStatsCard title={t('sellers')} value={usersStats.sellers.toLocaleString()} icon={Store} href="/admin/users?is_seller=true" isPrimary />
          <AdminStatsCard title={t('staff')} value={usersStats.staff.toLocaleString()} icon={Shield} href="/admin/users?is_staff=true" isPrimary />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={isActiveFilter || 'all'} onValueChange={(v) => setIsActiveFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder={t('status_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_status')}</SelectItem><SelectItem value="true">{t('active')}</SelectItem><SelectItem value="false">{t('inactive')}</SelectItem></SelectContent>
          </Select>
          <Select value={isSellerFilter || 'all'} onValueChange={(v) => setIsSellerFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder={t('seller_status_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_sellers')}</SelectItem><SelectItem value="true">{t('sellers')}</SelectItem><SelectItem value="false">{t('non_sellers')}</SelectItem></SelectContent>
          </Select>
          <Select value={isStaffFilter || 'all'} onValueChange={(v) => setIsStaffFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder={t('staff_status_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_staff')}</SelectItem><SelectItem value="true">{t('staff')}</SelectItem><SelectItem value="false">{t('non_staff')}</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []} columns={columns} loading={isLoading} searchable searchPlaceholder={t('search_placeholder')}
        serverSide total={data?.count || 0}
        onParamsChange={(p) => { if (p.page !== page) setPage(p.page); if (p.search !== search) { setSearch(p.search); setPage(1) } }}
        onRowClick={(u) => window.location.href = `/admin/users/${u.id}`}
        onEdit={(u) => window.location.href = `/admin/users/${u.id}`}
        onDelete={(u) => { setUserToDelete(u); setShowDeleteDialog(true) }}
        pagination={{ page, pageSize: 25 }}
        actions={(u) => {
          const isUpdating = updatingUserId === u.id
          return (
            <div className="flex items-center gap-2">
              <Link href={`/admin/users/${u.id}`}><Button variant="outline" size="sm" className="h-8">{t('view_details')}</Button></Link>
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={(e) => { e.stopPropagation(); handleToggleActive(u) }}>
                {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{u.is_active ? t('deactivating') : t('activating')}</> : (u.is_active ? t('deactivate') : t('activate'))}
              </Button>
            </div>
          )
        }}
      />
      
      <Dialog open={showSelfDeactivateDialog} onOpenChange={setShowSelfDeactivateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('confirm_deactivation_title')}</DialogTitle><DialogDescription>{t('confirm_deactivation_desc')}</DialogDescription></DialogHeader>
          <div className="py-4"><p className="text-sm text-gray-600">{t('confirm_deactivation_q')}</p></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSelfDeactivateDialog(false); setPendingUser(null) }}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleConfirmSelfDeactivate}>{t('yes_deactivate_my_account')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={async () => { if (!userToDelete) return; try { await deleteUser.mutateAsync(userToDelete.id); setShowDeleteDialog(false); setUserToDelete(null) } catch (e) {} }}
        title={t('delete_user_title', { name: userToDelete ? getUserFullName(userToDelete) : '' })}
        description={t('delete_user_desc')}
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}
