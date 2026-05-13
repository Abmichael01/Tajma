"use client"

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import { useAdminCategories, useUpdateAdminCategory, useDeleteAdminCategory, useAdminStats } from '@/hooks/useAdmin'
import type { AdminCategory } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, CheckCircle, XCircle, Eye, Edit } from 'lucide-react'
import { Link } from '@/i18n/routing'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import CategoryEditDialog from '@/components/admin/CategoryEditDialog'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { useTranslations } from 'next-intl'
import { useCategoryTableColumns } from '@/components/admin/categories/CategoryTableColumns'
import CreateCategoryDialog from '@/components/admin/categories/CreateCategoryDialog'

export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories')
  const t_table = useTranslations('admin.categories.table')
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(searchParams.get('is_active') || undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(searchParams.get('category_type') || undefined)

  const { data, isLoading } = useAdminCategories({ page, search: search || undefined, is_active: isActiveFilter ? isActiveFilter === 'true' : undefined, category_type: typeFilter })
  const { data: stats } = useAdminStats()
  const updateCategory = useUpdateAdminCategory()
  const deleteCategory = useDeleteAdminCategory()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)

  const { data: allCategoriesData } = useAdminCategories({ page: 1 })
  const allCategories = allCategoriesData?.results || []

  const categoriesStats = useMemo(() => {
    if (!stats || !data?.results) return null
    const active = data.results.filter(cat => cat.is_active).length
    const inactive = data.results.filter(cat => !cat.is_active).length
    return {
      total: stats.total_categories || data.count || 0,
      active: isActiveFilter === 'true' ? data.count : (isActiveFilter === 'false' ? 0 : stats.active_categories || active),
      inactive: isActiveFilter === 'false' ? data.count : (isActiveFilter === 'true' ? 0 : inactive),
    }
  }, [data, stats, isActiveFilter])

  const columns = useCategoryTableColumns(t_table)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-medium text-gray-900">{t('title')}</h1><p className="text-gray-600 mt-1">{t('description')}</p></div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />{t('new_category')}</Button>
      </div>

      {categoriesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard title={t('total_categories')} value={categoriesStats.total.toLocaleString()} icon={Plus} href="/admin/categories" isPrimary />
          <AdminStatsCard title={t('active')} value={categoriesStats.active.toLocaleString()} icon={CheckCircle} href="/admin/categories?is_active=true" />
          <AdminStatsCard title={t('inactive')} value={categoriesStats.inactive.toLocaleString()} icon={XCircle} href="/admin/categories?is_active=false" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={isActiveFilter || 'all'} onValueChange={(v) => setIsActiveFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder={t('status_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_status')}</SelectItem><SelectItem value="true">{t('active')}</SelectItem><SelectItem value="false">{t('inactive')}</SelectItem></SelectContent>
          </Select>
          <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder={t('category_type_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_types')}</SelectItem><SelectItem value="product">Product</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="job">Job</SelectItem><SelectItem value="cv">CV</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []} columns={columns} loading={isLoading} searchable searchPlaceholder={t('search_placeholder')}
        serverSide total={data?.count || 0}
        onParamsChange={(p) => { if (p.page !== page) setPage(p.page); if (p.search !== search) { setSearch(p.search); setPage(1) } }}
        onRowClick={(c) => window.location.href = `/admin/categories/${c.id}`}
        onDelete={(c) => { setCategoryToDelete(c); setShowDeleteDialog(true) }}
        pagination={{ page, pageSize: 25 }}
        actions={(c) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip><TooltipTrigger asChild><Link href={`/admin/categories/${c.id}`} onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 border border-gray-200"><Eye className="w-4 h-4" /></Button></Link></TooltipTrigger><TooltipContent>{t('view_details')}</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 border border-gray-200" onClick={(e) => { e.stopPropagation(); setEditingCategory(c); setShowEditModal(true) }}><Edit className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('edit_category')}</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 border border-gray-200" onClick={(e) => { e.stopPropagation(); updateCategory.mutateAsync({ id: c.id, data: { is_active: !c.is_active } }) }}>{c.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}</Button></TooltipTrigger><TooltipContent>{c.is_active ? t('deactivate_category') : t('activate_category')}</TooltipContent></Tooltip>
          </div>
        )}
      />

      <CreateCategoryDialog open={showCreateModal} onOpenChange={setShowCreateModal} allCategories={allCategories} t={t} />
      {editingCategory && <CategoryEditDialog open={showEditModal} onOpenChange={setShowEditModal} category={editingCategory} />}
      <ConfirmDeleteDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={async () => { if (categoryToDelete) { await deleteCategory.mutateAsync(categoryToDelete.id); setShowDeleteDialog(false) } }} title={t('delete_category_title', { name: categoryToDelete?.name || '' })} description={t('delete_category_desc')} isLoading={deleteCategory.isPending} />
    </div>
  )
}
