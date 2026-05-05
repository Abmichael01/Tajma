"use client"

import React, { useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminLeads } from '@/hooks/useAdmin'
import type { AdminLead } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, MousePointer2, MessageSquare, Clock, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminLeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: response, isLoading } = useAdminLeads({
    page,
    search,
  })

  const leadsList = response?.results || []
  const totalCount = response?.count || 0

  const columns: Column<AdminLead>[] = [
    {
      key: 'client',
      header: 'Buyer / Client',
      render: (lead) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{lead.client_detail?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500">{lead.client_detail?.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (lead) => (
        <div className="text-sm">
          <p className="font-medium text-gray-700">User ID: {lead.seller}</p>
        </div>
      )
    },
    {
      key: 'ad',
      header: 'Related Ad',
      render: (lead) => lead.ad_detail ? (
        <p className="truncate max-w-[200px] text-sm text-primary font-medium">
          {lead.ad_detail.title}
        </p>
      ) : '-'
    },
    {
      key: 'interaction_count',
      header: 'Interactions',
      render: (lead) => (
        <Badge variant="secondary" className="font-semibold">
          {lead.interaction_count}
        </Badge>
      )
    },
    {
      key: 'last_source',
      header: 'Last Source',
      render: (lead) => (
        <Badge variant="outline" className="capitalize">
          {lead.last_source_display || lead.last_source}
        </Badge>
      )
    },
    {
      key: 'messaged',
      header: 'Messaged',
      render: (lead) => lead.messaged ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
          <MessageSquare className="w-3 h-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-400">No</Badge>
      )
    },
    {
      key: 'last_interacted_at',
      header: 'Last Activity',
      render: (lead) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {format(new Date(lead.last_interacted_at), 'MMM d, p')}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Interaction Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track prospective buyer leads and platform engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Leads"
          value={totalCount}
          icon={MousePointer2}
          isPrimary={true}
        />
        <AdminStatsCard
          title="Messaged"
          value={leadsList.filter((l) => l.messaged).length}
          icon={MessageSquare}
        />
        <AdminStatsCard
          title="Interactions"
          value={leadsList.reduce((acc, curr) => acc + curr.interaction_count, 0)}
          icon={ArrowUpRight}
        />
      </div>

      <DataTable
        data={leadsList}
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
        actions={(lead) => (
          <Button variant="ghost" size="sm" asChild>
            <a href={`/ads/${lead.ad}`} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </Button>
        )}
      />
    </div>
  )
}

