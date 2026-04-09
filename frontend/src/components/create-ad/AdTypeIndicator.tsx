"use client"

import React from 'react'
import { Package, Wrench, Briefcase, FileText, Users } from 'lucide-react'

interface AdTypeIndicatorProps {
  adType: 'product' | 'service' | 'job' | 'cv'
}

export default function AdTypeIndicator({ adType }: AdTypeIndicatorProps) {
  const config = {
    product: { icon: Package, label: 'Selling Product', color: 'text-secondary' },
    service: { icon: Wrench, label: 'Offering Service', color: 'text-primary' },
    job: { icon: Users, label: 'Hiring', color: 'text-green-600' },
    cv: { icon: FileText, label: 'Posting CV', color: 'text-blue-600' }
  }
  
  const { icon: Icon, label, color } = config[adType]
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium ${color}`}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  )
}

