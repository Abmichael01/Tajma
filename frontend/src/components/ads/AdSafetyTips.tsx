"use client"

import React from 'react'

interface AdSafetyTipsProps {
  className?: string
}

export default function AdSafetyTips({ className = '' }: AdSafetyTipsProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-blue-900 mb-2">Safety Tips</h4>
      <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
        <li>• Meet in a public place</li>
        <li>• Inspect the item before paying</li>
        <li>• Never pay in advance</li>
        <li>• Report suspicious activity</li>
      </ul>
    </div>
  )
}

