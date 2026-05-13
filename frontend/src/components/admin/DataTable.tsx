"use client"

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useTranslations } from 'next-intl'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
  serverSide?: boolean
  total?: number
  onParamsChange?: (params: { page: number; search: string; filters?: any; sort?: string; order?: 'asc' | 'desc' }) => void
  pagination?: {
    page: number
    pageSize: number
    total?: number
    onPageChange?: (page: number) => void
  }
  emptyMessage?: string
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder,
  onSearch,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  serverSide = false,
  total,
  onParamsChange,
  pagination,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations('admin.table')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const effectiveSearchPlaceholder = searchPlaceholder || t('search_placeholder')
  const effectiveEmptyMessage = emptyMessage || t('empty_message')

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (serverSide) {
      onParamsChange?.({ 
        page: 1, 
        search: query, 
        sort: sortColumn || undefined, 
        order: sortDirection 
      })
    } else if (onSearch) {
      onSearch(query)
    }
  }

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const nextDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(columnKey)
    setSortDirection(nextDirection)

    if (serverSide) {
      onParamsChange?.({ 
        page: pagination?.page || 1, 
        search: searchQuery, 
        sort: columnKey, 
        order: nextDirection 
      })
    }
  }

  // Sort data (only if not serverSide)
  const sortedData = useMemo(() => {
    if (serverSide || !sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortColumn]
      const bValue = (b as any)[sortColumn]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [data, sortColumn, sortDirection])

  // Pagination calculations
  const actualTotal = serverSide ? (total || 0) : (pagination?.total || sortedData.length)
  const totalPages = pagination ? Math.ceil(actualTotal / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination
    ? Math.min(pagination.page * pagination.pageSize, actualTotal)
    : sortedData.length

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12">
        <MarketplaceLoader size="md" message={t('loading_data')} />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Search bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={effectiveSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:transition-colors">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                    >
                      <span>{column.header}</span>
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {(onEdit || onDelete || actions) && (
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete || actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  {effectiveEmptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'hover:bg-gray-50/50 cursor-pointer transition-colors' : 'hover:bg-gray-50/50 transition-colors'}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-900 font-normal">
                      {column.render ? column.render(item) : String((item as any)[column.key] || '-')}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions) && (
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm">
                      {actions ? (
                        actions(item)
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
          <div className="text-sm text-gray-600">
            {t('showing')} <span className="font-medium text-gray-900">{startItem}</span> {t('to')}{' '}
            <span className="font-medium text-gray-900">{endItem}</span> {t('of')}{' '}
            <span className="font-medium text-gray-900">{actualTotal}</span> {t('results')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverSide) {
                  onParamsChange?.({ page: pagination.page - 1, search: searchQuery, sort: sortColumn || undefined, order: sortDirection })
                } else {
                  pagination.onPageChange?.(pagination.page - 1)
                }
              }}
              disabled={pagination.page === 1}
              className="h-8 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              {t('previous')}
            </Button>
            <div className="text-sm text-gray-600 font-medium">
              {t('page')} {pagination.page} {t('of')} {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverSide) {
                  onParamsChange?.({ page: pagination.page + 1, search: searchQuery, sort: sortColumn || undefined, order: sortDirection })
                } else {
                  pagination.onPageChange?.(pagination.page + 1)
                }
              }}
              disabled={pagination.page >= totalPages}
              className="h-8 text-xs"
            >
              {t('next')}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
