"use client"

import React, { useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import { useLocations } from '@/hooks/useLocations'
import type { Location } from '@/api/countries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, MapPin, ChevronRight, Home, Eye, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { Link } from '@/i18n/routing'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import apiClient from '@/api/apiClient'

export default function AdminCountriesPage() {
  // ── View state ─────────────────────────────────────────────────────────────
  // Start at level 1 (countries). Clicking a country drills into level 2 (departments).
  const [activeLevel, setActiveLevel] = useState<1 | 2>(1)
  const [activeParentId, setActiveParentId] = useState<number | null>(null)
  const [activeParentName, setActiveParentName] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    sort_order: 0,
    level: 1,
    parent: null as number | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [regionToDelete, setRegionToDelete] = useState<Location | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  // Main table query — always scoped to the active level
  const { data: response, isLoading, refetch } = useLocations({
    page,
    search,
    level: activeLevel,
    parent: activeLevel === 2 ? activeParentId ?? undefined : undefined,
  })

  // Separate query for the parent dropdown in modals — always fetches all countries
  const { data: countriesResponse } = useLocations({ level: 1, page: 1 })
  const allCountries = countriesResponse?.results || []

  const regionsList = response?.results || []
  const totalCount = response?.count || 0

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleDrillDown = (region: Location) => {
    setActiveParentId(region.id)
    setActiveParentName(region.name)
    setActiveLevel(2)
    setPage(1)
    setSearch('')
  }

  const resetToCountries = () => {
    setActiveParentId(null)
    setActiveParentName(null)
    setActiveLevel(1)
    setPage(1)
    setSearch('')
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const extractErrors = (error: any): Record<string, string> => {
    const data = error?.response?.data
    if (!data) return {}
    const fieldErrors: Record<string, string> = {}
    Object.keys(data).forEach((key) => {
      const value = data[key]
      fieldErrors[key] = Array.isArray(value) ? value[0] : String(value)
    })
    return fieldErrors
  }

  const handleCreate = async () => {
    setErrors({})
    setIsSubmitting(true)
    try {
      await apiClient.post('/regions/', formData)
      toast.success('Location created successfully')
      setShowCreateModal(false)
      setFormData({ name: '', is_active: true, sort_order: 0, level: activeLevel, parent: activeParentId })
      refetch()
    } catch (error: any) {
      const fieldErrors = extractErrors(error)
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else toast.error('Failed to create location')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRegion?.id) return
    setErrors({})
    setIsSubmitting(true)
    try {
      await apiClient.put(`/regions/${editingRegion.id}/`, formData)
      toast.success('Location updated successfully')
      setShowEditModal(false)
      setEditingRegion(null)
      refetch()
    } catch (error: any) {
      const fieldErrors = extractErrors(error)
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else toast.error('Failed to update location')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (region: Location) => {
    setRegionToDelete(region)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!regionToDelete?.id) return
    try {
      await apiClient.delete(`/regions/${regionToDelete.id}/`)
      toast.success('Location deleted successfully')
      setShowDeleteDialog(false)
      setRegionToDelete(null)
      refetch()
    } catch {
      toast.error('Failed to delete location')
    }
  }

  const handleOpenEditModal = (region: Location) => {
    setEditingRegion(region)
    setFormData({
      name: region.name,
      is_active: true,
      sort_order: region.sort_order ?? 0,
      level: region.level || activeLevel,
      parent: typeof region.parent === 'number' ? region.parent : null,
    })
    setShowEditModal(true)
  }

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      is_active: true,
      sort_order: 0,
      level: activeLevel,
      parent: activeLevel === 2 ? activeParentId : null,
    })
    setShowCreateModal(true)
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (region) =>
        activeLevel === 1 ? (
          <button
            onClick={() => handleDrillDown(region)}
            className="font-medium text-primary hover:underline text-left"
          >
            {region.name}
          </button>
        ) : (
          <span className="font-medium">{region.name}</span>
        ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (region) => <span className="text-gray-500 text-sm">{region.slug || '—'}</span>,
    },
    {
      key: 'adsCount',
      header: 'Ads',
      render: (region) => (
        <Badge variant="outline" className="bg-gray-50">
          {region.adsCount.toLocaleString()}
        </Badge>
      ),
    },
  ]

  const isCountriesView = activeLevel === 1

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Countries</h1>
            <p className="text-gray-600 mt-1">
              {isCountriesView
                ? 'All countries — click a country to view its departments'
                : `Departments of ${activeParentName}`}
            </p>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            {isCountriesView ? 'New Country' : 'New Department'}
          </Button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm w-fit">
          <button onClick={resetToCountries} className="text-gray-400 hover:text-primary p-0.5">
            <Home className="w-4 h-4" />
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <button
            onClick={resetToCountries}
            className={isCountriesView ? 'font-medium text-gray-900' : 'text-gray-500 hover:text-primary'}
          >
            Countries
          </button>
          {activeParentName && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="font-medium text-gray-900">{activeParentName}</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatsCard
            title={isCountriesView ? 'Total Countries' : 'Total Departments'}
            value={totalCount.toLocaleString()}
            icon={MapPin}
            href="/admin/countries"
            isPrimary
          />
          <AdminStatsCard
            title="With Ads"
            value={regionsList.filter(r => r.adsCount > 0).length.toLocaleString()}
            icon={MapPin}
          />
          <AdminStatsCard
            title="Total Ads"
            value={regionsList.reduce((s, r) => s + r.adsCount, 0).toLocaleString()}
            icon={MapPin}
          />
        </div>

        {/* Table */}
        <DataTable
          data={regionsList}
          columns={columns}
          loading={isLoading}
          serverSide
          total={totalCount}
          pagination={{ page, pageSize: 20 }}
          onParamsChange={(params) => {
            if (params.page !== page) setPage(params.page)
            if (params.search !== search) {
              setSearch(params.search)
              setPage(1)
            }
          }}
          emptyMessage={
            isCountriesView
              ? 'No countries found'
              : `No departments found in ${activeParentName}`
          }
          actions={(region) => (
            <div className="flex items-center gap-1">
              {activeLevel === 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleDrillDown(region)}>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">View departments</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/admin/countries/${region.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">View details</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(region)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(region)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete</TooltipContent>
              </Tooltip>
            </div>
          )}
        />

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {formData.level === 1 ? 'Add New Country' : 'Add New Department'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.level === 1 ? 'e.g., Niger' : 'e.g., Niamey'}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              {formData.level === 2 && (
                <div>
                  <Label htmlFor="parent">Country *</Label>
                  <Select
                    value={formData.parent?.toString() || ''}
                    onValueChange={(val) => setFormData({ ...formData, parent: parseInt(val) })}
                  >
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.parent && <p className="text-sm text-red-600 mt-1">{errors.parent}</p>}
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
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {formData.level === 1 ? 'Country' : 'Department'}
              </DialogTitle>
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

              {formData.level === 2 && (
                <div>
                  <Label htmlFor="edit_parent">Country *</Label>
                  <Select
                    value={formData.parent?.toString() || ''}
                    onValueChange={(val) => setFormData({ ...formData, parent: parseInt(val) })}
                  >
                    <SelectTrigger id="edit_parent">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries
                        .filter((c) => c.id !== editingRegion?.id)
                        .map((country) => (
                          <SelectItem key={country.id} value={country.id.toString()}>
                            {country.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.parent && <p className="text-sm text-red-600 mt-1">{errors.parent}</p>}
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
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          title={`Delete ${regionToDelete?.name}?`}
          description={
            regionToDelete?.level === 1
              ? 'This will also delete all departments inside this country. This cannot be undone.'
              : 'This department will be permanently deleted.'
          }
          isLoading={isSubmitting}
        />
      </div>
    </TooltipProvider>
  )
}
