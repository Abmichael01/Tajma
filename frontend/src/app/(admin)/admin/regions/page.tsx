"use client"

import React, { useState, useMemo } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useRegions } from '@/hooks/useRegions'
import type { Region } from '@/api/regions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, MapPin, CheckCircle, XCircle, Eye, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import apiClient from '@/api/apiClient'

export default function AdminRegionsPage() {
  const { data: regions, isLoading, refetch } = useRegions()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    sort_order: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const regionsList = regions || []

  const stats = useMemo(() => {
    const total = regionsList.length
    const active = regionsList.filter(r => r.adsCount > 0).length
    const totalAds = regionsList.reduce((sum, r) => sum + r.adsCount, 0)
    return { total, active, totalAds }
  }, [regionsList])

  const handleCreate = async () => {
    setErrors({})
    setIsSubmitting(true)

    try {
      await apiClient.post('/regions/', formData)
      toast.success('Region created successfully')
      setShowCreateModal(false)
      setFormData({ name: '', is_active: true, sort_order: 0 })
      refetch()
    } catch (error: any) {
      if (error?.response?.data) {
        const fieldErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach((key) => {
          const value = error.response.data[key]
          if (Array.isArray(value)) {
            fieldErrors[key] = value[0]
          } else if (typeof value === 'string') {
            fieldErrors[key] = value
          }
        })
        setErrors(fieldErrors)
      } else {
        toast.error('Failed to create region')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRegion || !editingRegion.id) return

    setErrors({})
    setIsSubmitting(true)

    try {
      await apiClient.put(`/regions/${editingRegion.id}/`, formData)
      toast.success('Region updated successfully')
      setShowEditModal(false)
      setEditingRegion(null)
      refetch()
    } catch (error: any) {
      if (error?.response?.data) {
        const fieldErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach((key) => {
          const value = error.response.data[key]
          if (Array.isArray(value)) {
            fieldErrors[key] = value[0]
          } else if (typeof value === 'string') {
            fieldErrors[key] = value
          }
        })
        setErrors(fieldErrors)
      } else {
        toast.error('Failed to update region')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (region: Region) => {
    if (!region.id) return
    if (!confirm(`Are you sure you want to delete "${region.name}"?`)) return

    try {
      await apiClient.delete(`/regions/${region.id}/`)
      toast.success('Region deleted successfully')
      refetch()
    } catch (error: any) {
      toast.error('Failed to delete region')
    }
  }

  const handleToggleActive = async (region: Region) => {
    if (!region.id) return

    try {
      await apiClient.patch(`/regions/${region.id}/`, {
        is_active: !region.adsCount, // This is a placeholder - we need to track is_active
      })
      refetch()
    } catch (error: any) {
      toast.error('Failed to update region')
    }
  }

  const handleOpenEditModal = (region: Region) => {
    setEditingRegion(region)
    setFormData({
      name: region.name,
      is_active: true, // We'd need to get this from API
      sort_order: 0, // We'd need to get this from API
    })
    setShowEditModal(true)
  }

  const columns: Column<Region>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (region) => region.slug || '-',
    },
    {
      key: 'adsCount',
      header: 'Ads Count',
      render: (region) => (
        <Badge variant="outline">
          {region.adsCount.toLocaleString()}
        </Badge>
      ),
    },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Regions</h1>
            <p className="text-gray-600 mt-1">Manage all regions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Region
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminStatsCard
              title="Total Regions"
              value={stats.total.toLocaleString()}
              icon={MapPin}
              href="/admin/regions"
              isPrimary={true}
            />
            <AdminStatsCard
              title="Regions with Ads"
              value={stats.active.toLocaleString()}
              icon={MapPin}
            />
            <AdminStatsCard
              title="Total Ads"
              value={stats.totalAds.toLocaleString()}
              icon={MapPin}
            />
          </div>
        )}

        {/* Data Table */}
        <DataTable
          data={regionsList}
          columns={columns}
          loading={isLoading}
          actions={(region) => (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/admin/regions/${region.slug || region.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">View details</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(region)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit region</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(region)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete region</TooltipContent>
              </Tooltip>
            </div>
          )}
        />

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Region</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Niamey"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Region</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="edit_sort_order">Sort Order</Label>
                <Input
                  id="edit_sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

