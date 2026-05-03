"use client"

import React, { useMemo, useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import {
  useAdminPromotionPackages,
  useCreateAdminPromotionPackage,
  useUpdateAdminPromotionPackage,
  useDeleteAdminPromotionPackage,
} from '@/hooks/useAdmin'
import type { AdminPromotionPackage } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { Edit, Megaphone, Plus, Trash2, Zap, Star } from 'lucide-react'

type PackageFormState = {
  name: string
  description: string
  promotion_type: 'boost' | 'featured'
  price: string
  discount_price: string
  duration_days: string
  is_active: boolean
}

const initialFormState: PackageFormState = {
  name: '',
  description: '',
  promotion_type: 'boost',
  price: '',
  discount_price: '',
  duration_days: '7',
  is_active: true,
}

const formatPrice = (value?: string | null) => {
  if (!value) return '-'
  return `${Number.parseFloat(value).toLocaleString()} XOF`
}

const getErrorMessage = (error: any) => {
  const data = error?.response?.data
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0]
    if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0])
    if (typeof firstValue === 'string') return firstValue
  }
  return 'Could not save package'
}

export default function AdminPromotionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [formData, setFormData] = useState<PackageFormState>(initialFormState)
  const [formError, setFormError] = useState('')
  const [editingPackage, setEditingPackage] = useState<AdminPromotionPackage | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<AdminPromotionPackage | null>(null)

  const { data, isLoading } = useAdminPromotionPackages({
    page,
    search: search || undefined,
    promotion_type: typeFilter === 'all' ? undefined : typeFilter,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  })
  const createPackage = useCreateAdminPromotionPackage()
  const updatePackage = useUpdateAdminPromotionPackage()
  const deletePackage = useDeleteAdminPromotionPackage()

  const packages = data?.results || []
  const totalCount = data?.count || 0

  const stats = useMemo(() => {
    const active = packages.filter((pkg) => pkg.is_active).length
    const boost = packages.filter((pkg) => pkg.promotion_type === 'boost').length
    const featured = packages.filter((pkg) => pkg.promotion_type === 'featured').length
    return { active, boost, featured }
  }, [packages])

  const openCreateModal = () => {
    setEditingPackage(null)
    setFormData(initialFormState)
    setFormError('')
    setShowFormModal(true)
  }

  const openEditModal = (pkg: AdminPromotionPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      promotion_type: pkg.promotion_type,
      price: pkg.price,
      discount_price: pkg.discount_price || '',
      duration_days: String(pkg.duration_days),
      is_active: pkg.is_active,
    })
    setFormError('')
    setShowFormModal(true)
  }

  const handleSave = async () => {
    setFormError('')
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formData.price || Number(formData.price) < 0) {
      setFormError('A valid price is required')
      return
    }
    if (!formData.duration_days || Number(formData.duration_days) < 1) {
      setFormError('Duration must be at least 1 day')
      return
    }
    if (formData.discount_price && Number(formData.discount_price) >= Number(formData.price)) {
      setFormError('Discount price must be lower than regular price')
      return
    }

    const payload: Partial<AdminPromotionPackage> = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      promotion_type: formData.promotion_type,
      price: formData.price,
      discount_price: formData.discount_price || null,
      duration_days: Number(formData.duration_days),
      is_active: formData.is_active,
    }

    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({ id: editingPackage.id, data: payload })
      } else {
        await createPackage.mutateAsync(payload)
      }
      setShowFormModal(false)
      setEditingPackage(null)
      setFormData(initialFormState)
    } catch (error: any) {
      setFormError(getErrorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!packageToDelete) return
    try {
      await deletePackage.mutateAsync(packageToDelete.id)
      setPackageToDelete(null)
    } catch (error) {}
  }

  const columns: Column<AdminPromotionPackage>[] = [
    {
      key: 'name',
      header: 'Package',
      render: (pkg) => (
        <div>
          <div className="font-medium text-gray-900">{pkg.name}</div>
          <div className="text-xs text-gray-500">{pkg.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'promotion_type',
      header: 'Type',
      render: (pkg) => (
        <Badge variant="outline" className="capitalize">
          {pkg.promotion_type === 'boost' ? <Zap className="w-3 h-3 mr-1" /> : <Star className="w-3 h-3 mr-1" />}
          {pkg.promotion_type}
        </Badge>
      ),
    },
    {
      key: 'duration_days',
      header: 'Duration',
      render: (pkg) => `${pkg.duration_days} ${pkg.duration_days === 1 ? 'day' : 'days'}`,
    },
    {
      key: 'price',
      header: 'Price',
      render: (pkg) => (
        <div>
          <div className="font-medium">{formatPrice(pkg.discount_price || pkg.price)}</div>
          {pkg.discount_price && <div className="text-xs text-gray-400 line-through">{formatPrice(pkg.price)}</div>}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (pkg) => (
        <Badge className={pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
          {pkg.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Promotion Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage seller promotion pricing</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          New Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatsCard title="Total Packages" value={totalCount} icon={Megaphone} isPrimary />
        <AdminStatsCard title="Active" value={stats.active} icon={Megaphone} />
        <AdminStatsCard title="Boost" value={stats.boost} icon={Zap} />
        <AdminStatsCard title="Featured" value={stats.featured} icon={Star} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="boost">Boost</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(value) => {
          setActiveFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={packages}
        columns={columns}
        loading={isLoading}
        serverSide
        total={totalCount}
        pagination={{ page, pageSize: 25 }}
        emptyMessage="No promotion packages found"
        onParamsChange={(params) => {
          if (params.page !== page) setPage(params.page)
          if (params.search !== search) {
            setSearch(params.search)
            setPage(1)
          }
        }}
        actions={(pkg) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEditModal(pkg)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPackageToDelete(pkg)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        )}
      />

      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'New Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.promotion_type}
                  onValueChange={(value: 'boost' | 'featured') => setFormData((prev) => ({ ...prev, promotion_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boost">Boost</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration days</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={formData.duration_days}
                  onChange={(event) => setFormData((prev) => ({ ...prev, duration_days: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount price</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.discount_price}
                  onChange={(event) => setFormData((prev) => ({ ...prev, discount_price: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked === true }))}
                />
                Active
              </label>
            </div>
            {formError && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createPackage.isPending || updatePackage.isPending}
            >
              Save Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!packageToDelete}
        onOpenChange={(open) => !open && setPackageToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Promotion Package?"
        description="This removes the package from purchase. Existing paid promotions are not deleted."
        isLoading={deletePackage.isPending}
      />
    </div>
  )
}
