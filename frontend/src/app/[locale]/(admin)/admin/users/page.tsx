"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser, useAdminStats } from '@/hooks/useAdmin'
import type { AdminUser } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Users, UserCheck, Store, Shield, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(
    searchParams.get('is_active') || undefined
  )
  const [isSellerFilter, setIsSellerFilter] = useState<string | undefined>(
    searchParams.get('is_seller') || undefined
  )
  const [isStaffFilter, setIsStaffFilter] = useState<string | undefined>(
    searchParams.get('is_staff') || undefined
  )

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
  
  // Track which user is being updated (for loading state)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  // Track confirmation dialog state
  const [showSelfDeactivateDialog, setShowSelfDeactivateDialog] = useState(false)
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null)
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  // Calculate stats from current data
  const usersStats = useMemo(() => {
    if (!stats) return null
    
    // Count from current page results for filtered views
    const activeCount = data?.results?.filter(user => user.is_active).length || 0
    const sellersCount = data?.results?.filter(user => user.is_seller).length || 0
    const staffCount = data?.results?.filter(user => user.is_staff).length || 0
    
    // When specific filter is applied, show the filtered count; otherwise show page count as approximation
    return {
      total: stats.total_users || 0,
      active: isActiveFilter === 'true' ? (data?.count || 0) : (isActiveFilter === 'false' ? (data?.count || 0) : activeCount),
      sellers: isSellerFilter === 'true' ? (data?.count || 0) : (isSellerFilter === 'false' ? (data?.count || 0) : sellersCount),
      staff: isStaffFilter === 'true' ? (data?.count || 0) : (isStaffFilter === 'false' ? (data?.count || 0) : staffCount),
    }
  }, [data, stats, isActiveFilter, isSellerFilter, isStaffFilter])

  const handleToggleActive = async (user: AdminUser) => {
    // Check if admin is trying to deactivate themselves
    if (currentUser && currentUser.id === user.id && user.is_active) {
      // Show confirmation dialog
      setPendingUser(user)
      setShowSelfDeactivateDialog(true)
      return
    }
    
    // Proceed with update
    setUpdatingUserId(user.id)
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { is_active: !user.is_active },
      })
    } catch (error) {
      // Error handled by mutation
    } finally {
      setUpdatingUserId(null)
    }
  }
  
  const handleConfirmSelfDeactivate = async () => {
    if (!pendingUser) return
    
    setUpdatingUserId(pendingUser.id)
    setShowSelfDeactivateDialog(false)
    
    try {
      await updateUser.mutateAsync({
        id: pendingUser.id,
        data: { is_active: false },
      })
      toast.warning('Your account has been deactivated. You will be logged out.')
      // The logout will happen automatically via the auth interceptor
    } catch (error) {
      // Error handled by mutation
    } finally {
      setUpdatingUserId(null)
      setPendingUser(null)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    try {
      await deleteUser.mutateAsync(userToDelete.id)
      setShowDeleteDialog(false)
      setUserToDelete(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'avatar',
      header: '',
      render: (user) => {
        const userName = getUserFullName(user)
        return (
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar || undefined} alt={userName} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        )
      },
      width: '60px',
    },
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{getUserFullName(user)}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'username',
      header: 'Username',
      render: (user) => user.username || '-',
      sortable: true,
    },
    {
      key: 'full_name',
      header: 'Full Name',
      render: (user) => `${user.first_name} ${user.last_name}`.trim() || '-',
      sortable: true,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.is_active ? 'default' : 'destructive'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'is_seller',
      header: 'Seller',
      render: (user) => (
        <Badge variant={user.is_seller ? 'default' : 'outline'}>
          {user.is_seller ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'is_staff',
      header: 'Staff',
      render: (user) => (
        <Badge variant={user.is_staff ? 'default' : 'outline'}>
          {user.is_staff ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'date_joined',
      header: 'Date Joined',
      render: (user) => new Date(user.date_joined).toLocaleDateString(),
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage all users</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {usersStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard
            title="Total Users"
            value={usersStats.total.toLocaleString()}
            icon={Users}
            href="/admin/users"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Active Users"
            value={usersStats.active.toLocaleString()}
            icon={UserCheck}
            href="/admin/users?is_active=true"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Sellers"
            value={usersStats.sellers.toLocaleString()}
            icon={Store}
            href="/admin/users?is_seller=true"
            isPrimary={true}
          />
          <AdminStatsCard
            title="Staff"
            value={usersStats.staff.toLocaleString()}
            icon={Shield}
            href="/admin/users?is_staff=true"
            isPrimary={true}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={isActiveFilter || 'all'}
            onValueChange={(value) => setIsActiveFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isSellerFilter || 'all'}
            onValueChange={(value) => setIsSellerFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seller Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sellers</SelectItem>
              <SelectItem value="true">Sellers</SelectItem>
              <SelectItem value="false">Non-Sellers</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isStaffFilter || 'all'}
            onValueChange={(value) => setIsStaffFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Staff Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="true">Staff</SelectItem>
              <SelectItem value="false">Non-Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by email, username, or name..."
        serverSide
        total={data?.count || 0}
        onParamsChange={(params) => {
          if (params.page !== page) setPage(params.page)
          if (params.search !== search) {
            setSearch(params.search)
            setPage(1)
          }
        }}
        onRowClick={(user) => {
          window.location.href = `/admin/users/${user.id}`
        }}
        onEdit={(user) => {
          window.location.href = `/admin/users/${user.id}`
        }}
        onDelete={handleDelete}
        pagination={{
            page,
            pageSize: 25,
        }}
        actions={(user) => {
          const isUpdating = updatingUserId === user.id
          return (
            <div className="flex items-center gap-2">
              <Link href={`/admin/users/${user.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  View Details
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleActive(user)
                }}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {user.is_active ? 'Deactivating...' : 'Activating...'}
                  </>
                ) : (
                  user.is_active ? 'Deactivate' : 'Activate'
                )}
              </Button>
            </div>
          )
        }}
      />
      
      {/* Confirmation Dialog for Self-Deactivation */}
      <Dialog open={showSelfDeactivateDialog} onOpenChange={setShowSelfDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              You are about to deactivate your own account. This will immediately log you out and prevent you from accessing the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to proceed? You will need another admin to reactivate your account.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSelfDeactivateDialog(false)
                setPendingUser(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSelfDeactivate}
            >
              Yes, Deactivate My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title={`Delete User: ${userToDelete ? getUserFullName(userToDelete) : ''}?`}
        description="Are you sure you want to delete this user? This will permanently remove their account, profile, and all associated data. This action cannot be undone."
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}

