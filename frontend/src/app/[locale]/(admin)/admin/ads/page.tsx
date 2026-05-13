"use client"

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import { useAdminAds, useUpdateAdminAd, useDeleteAdminAd, useAdminStats } from '@/hooks/useAdmin'
import type { AdminAd } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Package, FileText, Archive, CheckCircle, Eye } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { useTranslations } from 'next-intl'
import { useAdTableColumns } from '@/components/admin/ads/AdTableColumns'

export default function AdminAdsPage() {
  const t = useTranslations('admin.ads')
  const t_table = useTranslations('admin.ads.table')
  const t_common = useTranslations('common')
  const searchParams = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(searchParams.get('status') || undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(searchParams.get('ad_type') || undefined)

  const { data, isLoading } = useAdminAds({ page, search: search || undefined, status: statusFilter, ad_type: typeFilter })
  const { data: stats } = useAdminStats()
  const updateAd = useUpdateAdminAd()
  const deleteAd = useDeleteAdminAd()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [adToDelete, setAdToDelete] = useState<AdminAd | null>(null)

  const adsStats = useMemo(() => {
    if (!stats) return null
    return { total: stats.total_ads || 0, published: stats.active_ads || 0, draft: stats.draft_ads || 0, archived: stats.archived_ads || 0 }
  }, [stats])

  const handleStatusChange = async (ad: AdminAd, newStatus: string) => {
    const valid = ['draft', 'published', 'archived']
    if (!valid.includes(newStatus)) { toast.error(t('invalid_status_toast', { status: newStatus })); return }
    try { await updateAd.mutateAsync({ id: ad.id, data: { status: newStatus as any } }) } catch (e) {}
  }

  const columns = useAdTableColumns(t_table, t_common)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('description')}</p>
      </div>

      {adsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatsCard title={t('total_ads')} value={adsStats.total.toLocaleString()} icon={Package} href="/admin/ads" isPrimary />
          <AdminStatsCard title={t('published')} value={adsStats.published.toLocaleString()} icon={CheckCircle} href="/admin/ads?status=published" />
          <AdminStatsCard title={t('draft')} value={adsStats.draft.toLocaleString()} icon={FileText} href="/admin/ads?status=draft" />
          <AdminStatsCard title={t('archived')} value={adsStats.archived.toLocaleString()} icon={Archive} href="/admin/ads?status=archived" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-fit min-w-[140px]"><SelectValue placeholder={t('status_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_status')}</SelectItem><SelectItem value="published">{t('published')}</SelectItem><SelectItem value="draft">{t('draft')}</SelectItem><SelectItem value="archived">{t('archived')}</SelectItem></SelectContent>
          </Select>
          <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-fit min-w-[140px]"><SelectValue placeholder={t('ad_type_placeholder')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('all_types')}</SelectItem><SelectItem value="product">{t('product')}</SelectItem><SelectItem value="service">{t('service')}</SelectItem><SelectItem value="job">{t('job')}</SelectItem><SelectItem value="cv">{t('cv')}</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={data?.results || []} columns={columns} loading={isLoading} searchable searchPlaceholder={t('search_placeholder')}
        serverSide total={data?.count || 0}
        onParamsChange={(p) => { if (p.page !== page) setPage(p.page); if (p.search !== search) { setSearch(p.search); setPage(1) } }}
        onRowClick={(ad) => window.location.href = `/admin/ads/${ad.id}`}
        onDelete={(ad) => { setAdToDelete(ad); setShowDeleteDialog(true) }}
        pagination={{ page, pageSize: 25 }}
        actions={(ad) => (
          <div className="flex items-center gap-2">
            <Link href={`/admin/ads/${ad.id}`}><Button variant="outline" size="sm" className="h-8"><Eye className="w-4 h-4 mr-1.5" />{t('view')}</Button></Link>
            <Select value={ad.status} onValueChange={(v) => handleStatusChange(ad, v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="published">{t('published')}</SelectItem><SelectItem value="draft">{t('draft')}</SelectItem><SelectItem value="archived">{t('archived')}</SelectItem></SelectContent>
            </Select>
          </div>
        )}
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={async () => { if (!adToDelete) return; try { await deleteAd.mutateAsync(adToDelete.id); setShowDeleteDialog(false); setAdToDelete(null) } catch (e) {} }}
        title={t('delete_ad_title', { title: adToDelete?.title || '' })}
        description={t('delete_ad_desc')}
        isLoading={deleteAd.isPending}
      />
    </div>
  )
}
