"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface StatContainerProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export default function StatContainer({ title, value, icon, className }: StatContainerProps) {
  return (
    <div
      className={cn(
        'border border-gray-200 rounded-md p-4 bg-white',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-gray-400">{icon}</div>}
        <p className="text-sm text-gray-500 font-medium">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}


