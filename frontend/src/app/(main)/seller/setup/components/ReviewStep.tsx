import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { businessTypes } from './constants'

interface ReviewStepProps {
  formData: any
  regions: any
}

export default function ReviewStep({ formData, regions }: ReviewStepProps) {
  const getRegionName = (id: string) => {
    if (!id || !regions?.results) return '—'
    const region = regions.results.find((r: any) => r.id.toString() === id)
    return region?.name || '—'
  }

  const getBusinessTypeName = (val: string) => {
    return businessTypes.find(t => t.value === val)?.label || '—'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Review & Confirm</h3>
        <p className="text-sm text-gray-600 mt-1">Double-check your details before finishing setup.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50/50">
            <h4 className="text-sm font-semibold text-gray-900">Contact Information</h4>
          </div>
          <div className="divide-y divide-gray-200 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Phone</dt>
              <dd className="text-gray-900 font-medium">{formData.phone || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Location</dt>
              <dd className="text-gray-900 font-medium capitalize">
                {getRegionName(formData.locationId)}
              </dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Street Address</dt>
              <dd className="text-gray-900 font-medium">{formData.address || '—'}</dd>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50/50">
            <h4 className="text-sm font-semibold text-gray-900">Business Information</h4>
          </div>
          <div className="divide-y divide-gray-200 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Business Name</dt>
              <dd className="text-gray-900 font-medium">{formData.businessName || '—'}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Business Type</dt>
              <dd className="text-gray-900 font-medium">{getBusinessTypeName(formData.businessType)}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-medium text-gray-600 mb-1 sm:mb-0">Website</dt>
              <dd className="text-gray-900 font-medium break-all">{formData.website || '—'}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="font-medium text-gray-600 mb-1">About Your Business</dt>
              <dd className="text-gray-900 whitespace-pre-line">{formData.bio || '—'}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>You can always update these details later from your profile.</span>
      </div>
    </div>
  )
}
