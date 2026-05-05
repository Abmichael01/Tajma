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
import { Plus, MapPin, CheckCircle, XCircle, Eye, Trash2, Edit, ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { Link } from '@/i18n/routing'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import apiClient from '@/api/apiClient'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminRegionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    sort_order: 0,
    level: 1,
    parent: null as number | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeLevel, setActiveLevel] = useState<number | 'all'>('all')
  const [activeParentId, setActiveParentId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null)

  const { data: response, isLoading, refetch } = useRegions({
    page,
    search,
    level: activeLevel,
    parent: activeParentId,
  })

  const regionsList = response?.results || []
  const totalCount = response?.count || 0

  const activeParent = useMemo(() => {
    if (!activeParentId) return null
    // We might not have the active parent in the current page results
    // For now we'll try to find it, but ideally we'd fetch it separately or pass its name
    return regionsList.find(r => r.id === activeParentId)
  }, [regionsList, activeParentId])

  // Removed local filteredRegions useMemo as we now use backend results directly

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
      setFormData({ name: '', is_active: true, sort_order: 0, level: 1, parent: null })
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
    setRegionToDelete(region)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!regionToDelete?.id) return

    try {
      await apiClient.delete(`/regions/${regionToDelete.id}/`)
      toast.success('Region deleted successfully')
      setShowDeleteDialog(false)
      setRegionToDelete(null)
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
      is_active: true,
      sort_order: 0,
      level: region.level || 1,
      parent: region.parent || null,
    })
    setShowEditModal(true)
  }

  const handleOpenCreateModal = () => {
    const defaultLevel = activeParent ? (activeParent.level || 0) + 1 : 1
    const finalLevel = defaultLevel > 3 ? 3 : defaultLevel
    
    setFormData({
      name: '',
      is_active: true,
      sort_order: 0,
      level: finalLevel,
      parent: activeParentId,
    })
    setShowCreateModal(true)
  }

  const handleDrillDown = (region: Region) => {
    setActiveParentId(region.id)
    setActiveLevel(((region.level || 0) + 1) as any)
    setPage(1)
  }

  const resetFilters = () => {
    setActiveParentId(null)
    setActiveLevel('all')
    setPage(1)
  }

  const columns: Column<Region>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (region) => (
        <button 
          onClick={() => (region.level && region.level < 3) ? handleDrillDown(region) : null}
          className={region.level && region.level < 3 ? "text-primary hover:underline font-medium" : "font-medium"}
        >
          {region.name}
        </button>
      )
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (region) => region.slug || '-',
    },
    {
      key: 'level',
      header: 'Level',
      render: (region) => (
        <Badge variant={region.level === 1 ? 'default' : region.level === 2 ? 'secondary' : 'outline'}>
          {region.level === 1 ? 'Region' : region.level === 2 ? 'Dept' : 'Commune'}
        </Badge>
      ),
    },
    {
      key: 'parent_name',
      header: 'Parent',
      render: (region) => (region as any).parent_name || '-',
    },
    {
      key: 'adsCount',
      header: 'Ads Count',
      render: (region) => (
        <Badge variant="outline" className="bg-gray-50">
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
            <p className="text-gray-600 mt-1">Manage location hierarchy</p>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            New {activeLevel === 2 ? 'Dept' : activeLevel === 3 ? 'Commune' : 'Region'}
          </Button>
        </div>

        {/* Organization Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={activeLevel.toString()} onValueChange={(v: string) => {
            const nextLevel = v === 'all' ? 'all' : parseInt(v)
            setActiveLevel(nextLevel as any)
            setActiveParentId(null)
            setPage(1)
          }}>
            <TabsList>
              <TabsTrigger value="all">All Levels</TabsTrigger>
              <TabsTrigger value="1">Regions</TabsTrigger>
              <TabsTrigger value="2">Departments</TabsTrigger>
              <TabsTrigger value="3">Communes</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <button onClick={resetFilters} className="text-gray-500 hover:text-primary p-1">
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className={!activeParent ? "font-medium text-gray-900" : "text-gray-500"}>Niger</span>
            
            {activeParent && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="font-medium text-gray-900">{activeParent.name}</span>
              </>
            )}
          </div>
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
          serverSide
          total={totalCount}
          pagination={{
            page,
            pageSize: 20,
          }}
          onParamsChange={(params) => {
            if (params.page !== page) setPage(params.page)
            if (params.search !== search) {
              setSearch(params.search)
              setPage(1)
            }
          }}
          emptyMessage={activeParentId ? `No sub-locations found in ${activeParent?.name || 'this location'}` : "No regions found"}
          actions={(region) => (
            <div className="flex items-center gap-2">
              {region.level && region.level < 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleDrillDown(region)}>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">View children</TooltipContent>
                </Tooltip>
              )}
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
                <Label htmlFor="level">Level *</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(val) => setFormData({ ...formData, level: parseInt(val), parent: null })}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (Region)</SelectItem>
                    <SelectItem value="2">Level 2 (Department)</SelectItem>
                    <SelectItem value="3">Level 3 (Commune)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.level > 1 && (
                <div>
                  <Label htmlFor="parent">Parent {formData.level === 2 ? 'Region' : 'Department'} *</Label>
                  <Select
                    value={formData.parent?.toString() || ""}
                    onValueChange={(val) => setFormData({ ...formData, parent: parseInt(val) })}
                  >
                    <SelectTrigger id="parent">
                      <SelectValue placeholder={`Select ${formData.level === 2 ? 'Region' : 'Department'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {regionsList
                        .filter(r => r.level === formData.level - 1)
                        .map(parent => (
                          <SelectItem key={parent.id} value={parent.id.toString()}>
                            {parent.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Label htmlFor="edit_level">Level *</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(val) => setFormData({ ...formData, level: parseInt(val), parent: null })}
                >
                  <SelectTrigger id="edit_level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (Region)</SelectItem>
                    <SelectItem value="2">Level 2 (Department)</SelectItem>
                    <SelectItem value="3">Level 3 (Commune)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.level > 1 && (
                <div>
                  <Label htmlFor="edit_parent">Parent {formData.level === 2 ? 'Region' : 'Department'} *</Label>
                  <Select
                    value={formData.parent?.toString() || ""}
                    onValueChange={(val) => setFormData({ ...formData, parent: parseInt(val) })}
                  >
                    <SelectTrigger id="edit_parent">
                      <SelectValue placeholder={`Select ${formData.level === 2 ? 'Region' : 'Department'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {regionsList
                        .filter(r => r.level === formData.level - 1 && r.id !== editingRegion?.id)
                        .map(parent => (
                          <SelectItem key={parent.id} value={parent.id.toString()}>
                            {parent.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}

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

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          title={`Delete Region: ${regionToDelete?.name}?`}
          description="Are you sure you want to delete this region? This action will also delete all sub-regions (departments and communes) associated with it. This action cannot be undone."
          isLoading={isSubmitting} // Reusing isSubmitting for loading state if needed, but apiClient doesn't have a mutation state here
        />
      </div>
    </TooltipProvider>
  )
}

