"use client"

import React from 'react'
import { Column } from '@/components/admin/DataTable'
import type { AdminCategory } from '@/api/admin'
import { Badge } from '@/components/ui/badge'

export const useCategoryTableColumns = (t: any): Column<AdminCategory>[] => {
  return [
    { key: 'name', header: t('name'), sortable: true },
    { key: 'slug', header: t('slug'), sortable: true },
    { key: 'parent_name', header: t('parent'), render: (cat) => cat.parent_name || '-' },
    {
      key: 'category_type',
      header: t('type'),
      render: (cat) => <Badge variant="outline">{cat.category_type.charAt(0).toUpperCase() + cat.category_type.slice(1)}</Badge>,
    },
    {
      key: 'is_active',
      header: t('status'),
      render: (cat) => (
        <Badge variant={cat.is_active ? 'default' : 'destructive'}>
          {cat.is_active ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    { key: 'sort_order', header: t('sort_order'), sortable: true },
  ]
}
