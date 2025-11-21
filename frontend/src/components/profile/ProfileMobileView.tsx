"use client"

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfileMobileViewProps {
  title: string
  onBack: () => void
  children: React.ReactNode
}

export default function ProfileMobileView({ title, onBack, children }: ProfileMobileViewProps) {
  return (
    <div className="lg:hidden">
      {/* Back Button Header - Sticky below navbar */}
      <div className="sticky top-[var(--navbar-height,64px)] z-40 bg-white border-b border-gray-200 flex items-center gap-3 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="flex-shrink-0 rounded-full border border-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Content */}
      <div className="py-4">
        {children}
      </div>
    </div>
  )
}

