"use client"

import React from 'react'

interface AdSafetyTipsProps {
  className?: string
}

export default function AdSafetyTips({ className = '' }: AdSafetyTipsProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 p-4 rounded-xl ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">Safety Tips</h4>
      <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
        <li>• Meet in a public place</li>
        <li>• Inspect the item before paying</li>
        <li>• Never pay in advance</li>
        <li>• Report suspicious activity</li>
      </ul>
    </div>
  )
}

