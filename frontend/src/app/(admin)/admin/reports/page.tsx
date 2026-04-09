"use client"

import React, { useState, useEffect } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminReports, useResolveAdminReport, useDeleteAdminReport, useReplyAdminReport } from '@/hooks/useAdmin'
import type { AdminReport } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Eye, Trash2, CheckCircle, FileText, User, MessageSquare, Send, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminReportsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [adminReply, setAdminReply] = useState('')

  const { data: response, isLoading, refetch } = useAdminReports({
    page,
    search,
    status: status === 'all' ? undefined : status,
  })

  const resolveMutation = useResolveAdminReport()
  const deleteMutation = useDeleteAdminReport()
  const replyMutation = useReplyAdminReport()

  const reportsList = response?.results || []
  const totalCount = response?.count || 0

  useEffect(() => {
    if (selectedReport) {
      const updated = reportsList.find(r => r.id === selectedReport.id)
      if (updated) setSelectedReport(updated)
    }
  }, [reportsList, selectedReport])

  const handleResolve = async () => {
    if (!selectedReport) return
    
    try {
      await resolveMutation.mutateAsync({
        id: selectedReport.id,
        resolution_note: resolutionNote
      })
      setShowResolveModal(false)
      setResolutionNote('')
      setSelectedReport(null)
      refetch()
    } catch (error) {}
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport || !adminReply.trim()) return
    
    try {
      await replyMutation.mutateAsync({
        id: selectedReport.id,
        message: adminReply
      })
      setAdminReply('')
      refetch()
    } catch (error) {}
  }

  const handleDelete = async (report: AdminReport) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    
    try {
      await deleteMutation.mutateAsync(report.id)
      refetch()
    } catch (error) {}
  }

  const columns: Column<AdminReport>[] = [
    {
      key: 'report_type',
      header: 'Type',
      render: (report) => (
        <Badge variant="outline" className="capitalize">
          {report.report_type === 'ad' ? <FileText className="w-3 h-3 mr-1" /> : 
           report.report_type === 'user' ? <User className="w-3 h-3 mr-1" /> : 
           <MessageSquare className="w-3 h-3 mr-1" />}
          {report.report_type}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) => (
        <Badge 
          className={
            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }
        >
          {report.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (report) => <span className="capitalize">{report.reason.replace('_', ' ')}</span>
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (report) => report.reporter_details?.email || report.contact_email || 'Anonymous'
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (report) => format(new Date(report.created_at), 'MMM d, yyyy')
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Reports & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user reports and support tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <AdminStatsCard
           title="Total Reports"
           value={totalCount}
           icon={AlertTriangle}
           isPrimary={true}
         />
         <AdminStatsCard
           title="Pending"
           value={reportsList.filter(r => r.status === 'pending').length}
           icon={MessageSquare}
         />
         <AdminStatsCard
           title="Under Review"
           value={reportsList.filter(r => r.status === 'under_review').length}
           icon={Eye}
         />
         <AdminStatsCard
           title="Resolved"
           value={reportsList.filter(r => r.status === 'resolved').length}
           icon={CheckCircle}
         />
      </div>

      <div>
        <DataTable
          data={reportsList}
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
          onRowClick={(report) => setSelectedReport(report)}
          actions={(report) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                <Eye className="w-4 h-4" />
              </Button>
              {report.status !== 'resolved' && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedReport(report)
                  setShowResolveModal(true)
                }}>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleDelete(report)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={!!selectedReport && !showResolveModal} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-[32px] border-none shadow-2xl p-0">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden flex-1 py-4">
              {/* Report Info */}
              <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Type</Label>
                    <p className="font-medium capitalize">{selectedReport.report_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <p className="font-medium capitalize">{selectedReport.status}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Reason</Label>
                    <p className="font-medium capitalize">{selectedReport.reason.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Date</Label>
                    <p className="font-medium">{format(new Date(selectedReport.created_at), 'PPP p')}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                {selectedReport.status === 'resolved' && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <Label className="text-green-700 font-medium text-xs">Resolution Note</Label>
                    <p className="text-sm text-green-800 mt-1">{selectedReport.resolution_note || 'No note provided'}</p>
                    <p className="text-[10px] text-green-600 mt-2">
                      By {selectedReport.resolved_by_details?.email} on {selectedReport.resolved_at && format(new Date(selectedReport.resolved_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Chat View */}
              <div className="lg:col-span-3 flex flex-col bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden h-[500px] shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-500">
                  Support Conversation
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {selectedReport.messages?.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`max-w-[85%] p-3 rounded-[24px] text-sm shadow-sm ${
                        msg.is_admin_reply 
                          ? 'bg-primary text-white ml-auto shadow-primary/10' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className={`text-[10px] mt-1 block ${msg.is_admin_reply ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.is_admin_reply ? 'You (Admin)' : 'Reporter'} • {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                  {(!selectedReport.messages || selectedReport.messages.length === 0) && (
                    <div className="text-center py-20 text-gray-400 italic text-sm">
                      No interaction history with the user yet.
                    </div>
                  )}
                </div>

                <form onSubmit={handleReply} className="p-3 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a response to the user..." 
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      className="rounded-full bg-gray-50 border-gray-200 h-10"
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="rounded-full aspect-square p-0 w-10 min-w-[40px]" 
                      disabled={replyMutation.isPending || !adminReply.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
            {selectedReport?.status !== 'resolved' && (
              <Button onClick={() => setShowResolveModal(true)}>Resolve Report</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Resolution Note</Label>
              <Textarea
                id="note"
                placeholder="Describe how this report was handled..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 font-bold"
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
            >
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
