"use client"

import React, { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminReports, useResolveAdminReport, useDismissAdminReport, useDeleteAdminReport, useReplyAdminReport, useArchiveReportedAd, useWarnReportedUser, useSuspendReportedUser } from '@/hooks/useAdmin'
import type { AdminReport } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Eye, Trash2, CheckCircle, FileText, User, MessageSquare, Send, AlertTriangle, XCircle, Archive, UserX, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { toast } from 'sonner'

export default function AdminReportsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [adminReply, setAdminReply] = useState('')
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<AdminReport | null>(null)

  // Archive ad confirmation state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [reportToArchive, setReportToArchive] = useState<AdminReport | null>(null)

  // Suspend user confirmation state
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [reportToSuspend, setReportToSuspend] = useState<AdminReport | null>(null)

  // Warn user dialog state
  const [showWarnDialog, setShowWarnDialog] = useState(false)
  const [reportToWarn, setReportToWarn] = useState<AdminReport | null>(null)
  const [warnMessage, setWarnMessage] = useState('Please review Tajma marketplace rules. Future violations may lead to account restrictions.')

  const { data: response, isLoading, refetch } = useAdminReports({
    page,
    search,
    status: status === 'all' ? undefined : status,
  })

  const resolveMutation = useResolveAdminReport()
  const dismissMutation = useDismissAdminReport()
  const deleteMutation = useDeleteAdminReport()
  const replyMutation = useReplyAdminReport()
  const archiveAdMutation = useArchiveReportedAd()
  const warnUserMutation = useWarnReportedUser()
  const suspendUserMutation = useSuspendReportedUser()

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
      await resolveMutation.mutateAsync({ id: selectedReport.id, resolution_note: resolutionNote })
      setShowResolveModal(false)
      setResolutionNote('')
      setSelectedReport(null)
      refetch()
    } catch {
      toast.error('Failed to resolve report. Please try again.')
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport || !adminReply.trim()) return
    try {
      await replyMutation.mutateAsync({ id: selectedReport.id, message: adminReply })
      setAdminReply('')
      refetch()
    } catch {
      toast.error('Failed to send reply. Please try again.')
    }
  }

  const handleDelete = (report: AdminReport) => {
    setReportToDelete(report)
    setShowDeleteDialog(true)
  }

  const handleDismiss = async (report: AdminReport) => {
    try {
      await dismissMutation.mutateAsync({ id: report.id, resolution_note: 'No policy issue found.' })
      refetch()
    } catch {
      toast.error('Failed to dismiss report. Please try again.')
    }
  }

  // Archive: open confirmation dialog instead of window.confirm
  const handleArchiveAd = (report: AdminReport) => {
    if (!report.related_ad) return
    setReportToArchive(report)
    setShowArchiveDialog(true)
  }

  const confirmArchiveAd = async () => {
    if (!reportToArchive) return
    try {
      await archiveAdMutation.mutateAsync({
        id: reportToArchive.id,
        note: `Reported ad "${reportToArchive.related_ad_details?.title || reportToArchive.related_ad}" was archived by moderation.`,
      })
      setShowArchiveDialog(false)
      setReportToArchive(null)
      refetch()
    } catch {
      toast.error('Failed to archive ad. Please try again.')
    }
  }

  // Warn: open dialog with editable message instead of window.prompt
  const handleWarnUser = (report: AdminReport) => {
    if (!report.reported_user) return
    setReportToWarn(report)
    setShowWarnDialog(true)
  }

  const confirmWarnUser = async () => {
    if (!reportToWarn || !warnMessage.trim()) return
    try {
      await warnUserMutation.mutateAsync({ id: reportToWarn.id, message: warnMessage })
      setShowWarnDialog(false)
      setReportToWarn(null)
      refetch()
    } catch {
      toast.error('Failed to send warning. Please try again.')
    }
  }

  // Suspend: open confirmation dialog instead of window.confirm
  const handleSuspendUser = (report: AdminReport) => {
    if (!report.reported_user) return
    setReportToSuspend(report)
    setShowSuspendDialog(true)
  }

  const confirmSuspendUser = async () => {
    if (!reportToSuspend) return
    try {
      await suspendUserMutation.mutateAsync({
        id: reportToSuspend.id,
        note: `Reported user ${reportToSuspend.reported_user_details?.email || reportToSuspend.reported_user} was suspended by moderation.`,
      })
      setShowSuspendDialog(false)
      setReportToSuspend(null)
      refetch()
    } catch {
      toast.error('Failed to suspend user. Please try again.')
    }
  }

  const confirmDelete = async () => {
    if (!reportToDelete) return
    try {
      await deleteMutation.mutateAsync(reportToDelete.id)
      setShowDeleteDialog(false)
      setReportToDelete(null)
      setSelectedReport(null)
      refetch()
    } catch {
      toast.error('Failed to delete report. Please try again.')
    }
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
            report.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
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
              {!['resolved', 'dismissed'].includes(report.status) && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedReport(report)
                  setShowResolveModal(true)
                }}>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </Button>
              )}
              {!['resolved', 'dismissed'].includes(report.status) && (
                <Button variant="ghost" size="sm" onClick={() => handleDismiss(report)}>
                  <XCircle className="w-4 h-4 text-gray-600" />
                </Button>
              )}
              {report.related_ad && (
                <Button variant="ghost" size="sm" onClick={() => handleArchiveAd(report)}>
                  <Archive className="w-4 h-4 text-orange-600" />
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
                  <div className="mt-1 p-3 bg-gray-50 rounded-xl text-sm whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <Label className="text-gray-500">Moderation</Label>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedReport.related_ad && (
                      <>
                        <Button asChild variant="outline" size="sm" className="justify-start gap-2">
                          <Link href={`/admin/ads/${selectedReport.related_ad}`}>
                            <ExternalLink className="w-4 h-4" />
                            Open Ad
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2 text-orange-700"
                          onClick={() => handleArchiveAd(selectedReport)}
                          disabled={archiveAdMutation.isPending}
                        >
                          <Archive className="w-4 h-4" />
                          Archive Ad
                        </Button>
                      </>
                    )}
                    {selectedReport.reported_user && (
                      <>
                        <Button asChild variant="outline" size="sm" className="justify-start gap-2">
                          <Link href={`/admin/users/${selectedReport.reported_user}`}>
                            <ExternalLink className="w-4 h-4" />
                            Open User
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => handleWarnUser(selectedReport)}
                          disabled={warnUserMutation.isPending}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Warn User
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2 text-red-700"
                          onClick={() => handleSuspendUser(selectedReport)}
                          disabled={suspendUserMutation.isPending}
                        >
                          <UserX className="w-4 h-4" />
                          Suspend User
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {['resolved', 'dismissed'].includes(selectedReport.status) && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                    <Label className="text-green-700 font-medium text-xs">
                      {selectedReport.status === 'dismissed' ? 'Dismissal Note' : 'Resolution Note'}
                    </Label>
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
            {selectedReport && !['resolved', 'dismissed'].includes(selectedReport.status) && (
              <Button onClick={() => setShowResolveModal(true)}>Resolve Report</Button>
            )}
            {selectedReport && !['resolved', 'dismissed'].includes(selectedReport.status) && (
              <Button
                variant="outline"
                onClick={() => handleDismiss(selectedReport)}
                disabled={dismissMutation.isPending}
              >
                Dismiss
              </Button>
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

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Support Report?"
        description="Are you sure you want to delete this report? This will permanently remove the report record and all associated communication history. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />

      {/* Archive Ad Confirmation */}
      <ConfirmDeleteDialog
        open={showArchiveDialog}
        onOpenChange={(open) => { setShowArchiveDialog(open); if (!open) setReportToArchive(null) }}
        onConfirm={confirmArchiveAd}
        title={`Archive "${reportToArchive?.related_ad_details?.title || 'this ad'}"?`}
        description="The ad will be archived and hidden from the marketplace. The reporter will be notified. This action can be reversed from the Ads management page."
        isLoading={archiveAdMutation.isPending}
      />

      {/* Suspend User Confirmation */}
      <ConfirmDeleteDialog
        open={showSuspendDialog}
        onOpenChange={(open) => { setShowSuspendDialog(open); if (!open) setReportToSuspend(null) }}
        onConfirm={confirmSuspendUser}
        title={`Suspend ${reportToSuspend?.reported_user_details?.email || 'this user'}?`}
        description="The user's account will be suspended and they will lose access to the platform. This action can be reversed from the Users management page."
        isLoading={suspendUserMutation.isPending}
      />

      {/* Warn User Dialog */}
      <Dialog open={showWarnDialog} onOpenChange={(open) => { setShowWarnDialog(open); if (!open) setReportToWarn(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Warning to {reportToWarn?.reported_user_details?.email || 'User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">Edit the warning message below before sending.</p>
            <Textarea
              rows={4}
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarnDialog(false)}>Cancel</Button>
            <Button
              onClick={confirmWarnUser}
              disabled={warnUserMutation.isPending || !warnMessage.trim()}
            >
              {warnUserMutation.isPending ? 'Sending...' : 'Send Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
