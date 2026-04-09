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

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">N/A</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">None</span>
      }
      
      // Array of objects (e.g., array type fields with sub-fields)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return (
          <div className="space-y-2">
            {value.map((item: any, idx: number) => (
              <div key={idx} className="text-sm border-l-2 border-secondary/30 pl-2 py-1 bg-gray-50 rounded-lg">
                {Object.entries(item).map(([k, v]) => {
                  const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <div key={k} className="text-xs">
                      <span className="font-medium text-gray-700">{childLabel}:</span>{' '}
                      <span className="text-gray-900">{formatValue(v)}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      }
      
      // Simple array (e.g., tags, skills)
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item: any, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
            >
              {String(item)}
            </span>
          ))}
        </div>
      )
    }

    // Handle objects (nested objects)
    if (typeof value === 'object') {
      return (
        <div className="space-y-1.5 text-xs">
          {Object.entries(value).map(([k, v]) => {
            const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            return (
              <div key={k} className="flex items-start gap-2">
                <span className="font-medium text-gray-600 min-w-[80px]">{childLabel}:</span>
                <span className="text-gray-900">{formatValue(v)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }

    // Handle numbers with formatting
    if (typeof value === 'number') {
      // Format large numbers with commas
      if (value >= 1000) {
        return value.toLocaleString()
      }
      return String(value)
    }

    // Handle strings
    return <span className="text-gray-900">{String(value)}</span>
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ad Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(attributes).map(([key, value]) => {
          // Skip cv_file_name as it's usually shown elsewhere
          if (key === 'cv_file_name') return null
          
          // Format key: replace underscores with spaces and capitalize
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
          
          return (
            <div key={key} className="py-3 border-b border-gray-50 last:border-0 group">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{formattedKey}</p>
              <div className="text-sm font-medium text-gray-900">
                {formatValue(value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

