"use client"

import React from 'react'

interface AdInfoProps {
  attributes: Record<string, any>
  className?: string
}

export default function AdInfo({ attributes, className = '' }: AdInfoProps) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null
  }

  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ad Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {Object.entries(attributes).map(([key, value]) => {
          // Format key: replace underscores with spaces and capitalize
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
          
          // Format value based on type
          let formattedValue: string
          if (value === null || value === undefined) {
            formattedValue = 'N/A'
          } else if (typeof value === 'boolean') {
            formattedValue = value ? 'Yes' : 'No'
          } else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value)
          } else {
            formattedValue = String(value)
          }
          
          return (
            <div key={key}>
              <p className="text-gray-600 mb-1">{formattedKey}</p>
              <p className="font-medium text-gray-900">{formattedValue}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

