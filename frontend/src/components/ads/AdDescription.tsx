"use client"

import React from 'react'

interface AdDescriptionProps {
  description: string
  className?: string
}

export default function AdDescription({ description, className = '' }: AdDescriptionProps) {
  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 rounded-3xl ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Description</h2>
      <div className="prose max-w-none">
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
          {description || 'No description provided.'}
        </p>
      </div>
    </div>
  )
}

