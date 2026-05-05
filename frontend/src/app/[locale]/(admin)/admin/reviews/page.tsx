"use client"

import React, { useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { useAdminReviews, useDeleteAdminReview } from '@/hooks/useAdmin'
import type { AdminReview } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Star, Trash2, User, ExternalLink, CheckCircle, Eye, MessageSquare, Calendar, MessageCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null)
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null)

  const { data: response, isLoading, refetch } = useAdminReviews({
    page,
    search,
  })

  const deleteMutation = useDeleteAdminReview()

  const reviewsList = response?.results || []
  const totalCount = response?.count || 0

  const handleDelete = async (review: AdminReview) => {
    setReviewToDelete(review)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!reviewToDelete) return
    try {
      await deleteMutation.mutateAsync(reviewToDelete.id)
      setShowDeleteDialog(false)
      setReviewToDelete(null)
      setSelectedReview(null)
      refetch()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const columns: Column<AdminReview>[] = [
    {
      key: 'reviewer',
      header: 'Reviewer',
      render: (review) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-none mb-1">{review.reviewer.full_name || 'Anonymous'}</span>
            <span className="text-xs text-gray-500">{review.reviewer.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (review) => (
        <div className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100 w-fit">
          <span className="font-black text-sm mr-1">{review.rating}</span>
          <Star className="w-3.5 h-3.5 fill-current" />
        </div>
      )
    },
    {
      key: 'comment',
      header: 'Comment',
      width: '400px',
      render: (review) => (
        <p className="truncate max-w-[400px] text-gray-600 text-sm font-medium">
          {review.comment}
        </p>
      )
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (review) => (
        <div className="text-gray-500 text-sm">
          {format(new Date(review.created_at), 'MMM d, yyyy')}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">User Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Moderate and manage platform reviews to ensure quality interactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <AdminStatsCard
           title="Total Reviews"
           value={totalCount}
           icon={MessageCircle}
           isPrimary={true}
         />
         <AdminStatsCard
           title="5 Star Reviews"
           value={reviewsList.filter(r => r.rating === 5).length}
           icon={Star}
         />
         <AdminStatsCard
           title="Low Ratings (≤2)"
           value={reviewsList.filter(r => r.rating <= 2).length}
           icon={AlertCircle}
         />
      </div>

      <div>
        <DataTable

          data={reviewsList}
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
          onRowClick={(review) => setSelectedReview(review)}
          actions={(review) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setSelectedReview(review)}>
                <Eye className="w-4 h-4 text-gray-400" />
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full" asChild title="View Ad">
                <a href={`/ads/${review.ad}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-red-50" onClick={() => handleDelete(review)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="max-w-lg rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          {selectedReview && (
            <div className="flex flex-col">
              <div className="p-8 bg-gray-50 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                   <div className="flex items-center text-yellow-500">
                     <span className="text-3xl font-black mr-1">{selectedReview.rating}</span>
                     <Star className="w-8 h-8 fill-current" />
                   </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">
                  Review by {selectedReview.reviewer.full_name || 'Anonymous'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-secondary font-bold uppercase tracking-widest">
                   <Calendar className="w-3.5 h-3.5" />
                   {format(new Date(selectedReview.created_at), 'MMMM d, yyyy')}
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none pt-0.5">Comment Content</Label>
                  </div>
                  <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[24px] text-gray-700 text-base leading-relaxed italic">
                    "{selectedReview.comment}"
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[20px] border border-primary/10">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-primary uppercase">Related Listing</span>
                         <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{selectedReview.ad_title || 'Ad View'}</span>
                      </div>
                      <Button variant="secondary" size="sm" className="rounded-full text-xs font-bold px-4" asChild>
                        <a href={`/ads/${selectedReview.ad}`} target="_blank" rel="noopener noreferrer">
                          View Ad
                        </a>
                      </Button>
                   </div>
                   
                   <Button 
                    variant="ghost" 
                    className="w-full rounded-full h-12 font-bold text-red-500 hover:bg-red-50 gap-2"
                    onClick={() => handleDelete(selectedReview)}
                   >
                     <Trash2 className="w-4 h-4" />
                     Delete Review
                   </Button>
                </div>

                <Button variant="outline" className="w-full h-12 rounded-full font-bold text-gray-400" onClick={() => setSelectedReview(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Review?"
        description="Are you sure you want to delete this user review? This action cannot be undone and the review will be removed from the listing permanently."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
