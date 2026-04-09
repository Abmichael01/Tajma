"use client"

import React, { useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminKYCs, useApproveKYC, useRejectKYC } from '@/hooks/useAdmin'
import type { AdminKYC } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Shield, ShieldAlert, ShieldCheck, User, Globe, FileText, ExternalLink, Check, X, Users, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function AdminKYCPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedKYC, setSelectedKYC] = useState<AdminKYC | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: response, isLoading, refetch } = useAdminKYCs({
    page,
    search,
  })

  const approveMutation = useApproveKYC()
  const rejectMutation = useRejectKYC()

  const kycList = response?.results || []
  const totalCount = response?.count || 0

  const handleApprove = async () => {
    if (!selectedKYC) return
    try {
      await approveMutation.mutateAsync(selectedKYC.id)
      toast.success('KYC verified successfully')
      setSelectedKYC(null)
      refetch()
    } catch (error) {}
  }

  const handleReject = async () => {
    if (!selectedKYC || !rejectReason.trim()) return
    try {
      await rejectMutation.mutateAsync({ id: selectedKYC.id, reason: rejectReason })
      toast.success('KYC rejected successfully')
      setSelectedKYC(null)
      setIsRejecting(false)
      setRejectReason('')
      refetch()
    } catch (error) {}
  }

  const columns: Column<AdminKYC>[] = [
    {
      key: 'user',
      header: 'User',
      render: (kyc) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-none mb-1">{kyc.user_details?.full_name || 'Anonymous User'}</span>
            <span className="text-xs text-gray-500">{kyc.user_details?.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (kyc) => (
        <Badge 
          className={`rounded-full px-3 py-1 ${
            kyc.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
            kyc.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}
          variant="outline"
        >
          {kyc.status}
        </Badge>
      )
    },
    {
      key: 'result',
      header: 'Result',
      render: (kyc) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            kyc.result === 'verified' ? 'bg-green-500' : 
            kyc.result === 'rejected' ? 'bg-red-500' : 
            'bg-gray-300'
          }`} />
          <span className="capitalize font-medium text-sm text-gray-700">{kyc.result || 'No result'}</span>
        </div>
      )
    },
    {
      key: 'country',
      header: 'Country',
      render: (kyc) => (
        <div className="flex items-center gap-2 text-gray-600 font-medium">
          <Globe className="w-4 h-4 text-gray-400" />
          {kyc.country}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (kyc) => (
        <div className="text-gray-500 text-sm">
          {format(new Date(kyc.created_at), 'MMM d, yyyy')}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">KYC Verifications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manually manage user identity verifications</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Smile ID Integrated
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Verifications"
          value={totalCount}
          icon={Users}
          isPrimary={true}
        />
        <AdminStatsCard
          title="Verified"
          value={kycList.filter(k => k.result === 'verified').length}
          icon={ShieldCheck}
        />
        <AdminStatsCard
          title="Rejected"
          value={kycList.filter(k => k.result === 'rejected').length}
          icon={ShieldAlert}
        />
        <AdminStatsCard
          title="Pending Review"
          value={kycList.filter(k => k.status === 'pending').length}
          icon={AlertCircle}
        />
      </div>

      <div>
        <DataTable
          data={kycList}
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
          onRowClick={(kyc) => setSelectedKYC(kyc)}
          actions={(kyc) => (
            <Button variant="ghost" size="sm" onClick={() => setSelectedKYC(kyc)}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        />
      </div>

      <Dialog open={!!selectedKYC} onOpenChange={(open) => !open && (setSelectedKYC(null), setIsRejecting(false))}>
        <DialogContent className="max-w-lg rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          {selectedKYC && (
            <div className="flex flex-col">
              <div className={`p-8 flex flex-col items-center text-center ${
                selectedKYC.result === 'verified' ? 'bg-green-50' :
                selectedKYC.result === 'rejected' ? 'bg-red-50' :
                'bg-gray-50'
              }`}>
                <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-4 shadow-lg ${
                  selectedKYC.result === 'verified' ? 'bg-green-500 text-white' :
                  selectedKYC.result === 'rejected' ? 'bg-red-500 text-white' :
                  'bg-white text-gray-400'
                }`}>
                  {selectedKYC.result === 'verified' ? <ShieldCheck className="w-10 h-10" /> :
                   selectedKYC.result === 'rejected' ? <ShieldAlert className="w-10 h-10" /> :
                   <Shield className="w-10 h-10" />}
                </div>
                <h3 className="text-2xl font-black text-gray-900 capitalize mb-1">
                  {selectedKYC.result || 'Pending Review'}
                </h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Job ID: {selectedKYC.job_id.slice(0, 12)}...
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-gray-400">User Email</Label>
                    <p className="font-bold text-gray-900 text-sm truncate">{selectedKYC.user_details?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-gray-400">Document Type</Label>
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      {selectedKYC.document_type || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-gray-400">Country</Label>
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <Globe className="w-4 h-4 text-secondary" />
                      {selectedKYC.country}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-gray-400">Submission Date</Label>
                    <p className="font-bold text-gray-900 text-sm">{format(new Date(selectedKYC.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {isRejecting ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <Label className="font-bold text-gray-700">Rejection Reason</Label>
                    <Input 
                      placeholder="e.g. Document photo is too blurry"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="rounded-full h-12 px-6"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-full h-12" onClick={() => setIsRejecting(false)}>Cancel</Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1 rounded-full h-12 font-bold"
                        onClick={handleReject}
                        disabled={rejectMutation.isPending || !rejectReason.trim()}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {selectedKYC.result !== 'verified' && (
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 h-14 rounded-full font-bold gap-2 shadow-lg shadow-green-100 transition-all hover:scale-[1.02]"
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-5 h-5" />
                        Manually Approve
                      </Button>
                    )}
                    {selectedKYC.result !== 'rejected' && (
                      <Button 
                        variant="outline"
                        className="flex-1 h-14 rounded-full font-bold gap-2 border-red-100 text-red-600 hover:bg-red-50 transition-all"
                        onClick={() => setIsRejecting(true)}
                        disabled={approveMutation.isPending}
                      >
                        <X className="w-5 h-5" />
                        Reject
                      </Button>
                    )}
                  </div>
                )}
                
                <Button variant="ghost" className="w-full rounded-full text-gray-400 font-bold text-xs" onClick={() => setSelectedKYC(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
