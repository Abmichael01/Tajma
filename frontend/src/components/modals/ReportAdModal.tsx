"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/store/authStore'

interface ReportAdModalProps {
  isOpen: boolean
  onClose: () => void
  adId: string
  adTitle: string
}

const reportReasons = [
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'fake', label: 'Fake or Counterfeit Items' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam or Duplicate Listing' },
  { value: 'prohibited', label: 'Prohibited Items' },
  { value: 'misleading', label: 'Misleading Information' },
  { value: 'other', label: 'Other' },
]

export default function ReportAdModal({ isOpen, onClose, adId, adTitle }: ReportAdModalProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!reason) {
      setError('Please select a reason for reporting')
      return
    }

    if (details.length < 10) {
      setError('Please provide more details (at least 10 characters)')
      return
    }

    setIsLoading(true)

    try {
      const { user } = useAuthStore.getState()
      
      await reportsApi.create({
        related_ad: adId,
        reason: reason,
        description: details,
        report_type: 'ad',
        contact_email: user?.email || undefined // Fallback for guest reports if needed
      })

      setIsLoading(false)
      setIsSuccess(true)
      
      // Reset and close after success
      setTimeout(() => {
        setIsSuccess(false)
        setReason('')
        setDetails('')
        onClose()
      }, 3000)
    } catch (err: any) {
      console.error('Report submission error:', err)
      setError(err?.response?.data?.error || 'Failed to submit report. Please try again later.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setReason('')
      setDetails('')
      setError('')
      setIsSuccess(false)
      onClose()
    }
  }

  if (isSuccess) {
    return (
      <ResponsiveModal isOpen={isOpen} onClose={handleClose} title="Report Submitted" className="!max-w-md">
        <div className="py-8 text-center">
          <div className="bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Report Submitted
          </h3>
          <p className="text-gray-600">
            Thank you for helping keep Tajma Marketplace safe. We'll review this report within 24 hours.
          </p>
        </div>
      </ResponsiveModal>
    )
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report This Ad"
      description="Help us understand what's wrong with this ad. Your report is anonymous."
      className="!max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-6 bg-gray-50 p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Reporting ad:</p>
          <p className="font-medium text-gray-900">{adTitle}</p>
        </div>

        <div className="space-y-5 mb-6">
          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you reporting this ad? *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details *
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              className="w-full resize-none"
              placeholder="Please provide specific details about the issue..."
            />
            <p className="mt-1 text-sm text-gray-500">
              {details.length} / 500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Please note:</strong> False reports may result in account suspension. Only report ads that genuinely violate our policies.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <MarketplaceLoader inline size="sm" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}
