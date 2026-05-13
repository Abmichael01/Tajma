"use client"

import React from 'react'
import { Column } from '@/components/admin/DataTable'
import type { AdminUser } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserFullName, getUserInitials } from '@/utils/user'

export const useUserTableColumns = (t: any): Column<AdminUser>[] => {
  return [
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
      header: t('name'),
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
      header: t('username'),
      render: (user) => user.username || '-',
      sortable: true,
    },
    {
      key: 'full_name',
      header: t('full_name'),
      render: (user) => `${user.first_name} ${user.last_name}`.trim() || '-',
      sortable: true,
    },
    {
      key: 'is_active',
      header: t('status'),
      render: (user) => (
        <Badge variant={user.is_active ? 'default' : 'destructive'}>
          {user.is_active ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'is_seller',
      header: t('seller'),
      render: (user) => (
        <Badge variant={user.is_seller ? 'default' : 'outline'}>
          {user.is_seller ? t('yes') : t('no')}
        </Badge>
      ),
    },
    {
      key: 'is_staff',
      header: t('staff'),
      render: (user) => (
        <Badge variant={user.is_staff ? 'default' : 'outline'}>
          {user.is_staff ? t('yes') : t('no')}
        </Badge>
      ),
    },
    {
      key: 'date_joined',
      header: t('date_joined'),
      render: (user) => new Date(user.date_joined).toLocaleDateString(),
      sortable: true,
    },
  ]
}
