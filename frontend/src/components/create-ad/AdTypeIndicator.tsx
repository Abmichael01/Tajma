"use client"

import React from 'react'
import { Package, Wrench, Briefcase, FileText, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AdTypeIndicatorProps {
  adType: 'product' | 'service' | 'job' | 'cv'
}

export default function AdTypeIndicator({ adType }: AdTypeIndicatorProps) {
  const t = useTranslations('create_ad')
  const config = {
    product: { icon: Package, label: t('selling_product'), color: 'text-secondary' },
    service: { icon: Wrench, label: t('offering_service'), color: 'text-primary' },
    job: { icon: Users, label: t('hiring'), color: 'text-green-600' },
    cv: { icon: FileText, label: t('posting_cv'), color: 'text-blue-600' }
  }
  
  const { icon: Icon, label, color } = config[adType] ?? config['product']
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium ${color}`}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  )
}

