"use client"

import React from 'react'
import { Package, Wrench, Briefcase } from 'lucide-react'

interface AdTypeIndicatorProps {
  adType: 'product' | 'service' | 'cv'
}

export default function AdTypeIndicator({ adType }: AdTypeIndicatorProps) {
  const config = {
    product: { icon: Package, label: 'Selling Product', color: 'text-secondary' },
    service: { icon: Wrench, label: 'Offering Service', color: 'text-primary' },
    cv: { icon: Briefcase, label: 'Posting CV', color: 'text-blue-600' }
  }
  
  const { icon: Icon, label, color } = config[adType]
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium ${color}`}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  )
}

