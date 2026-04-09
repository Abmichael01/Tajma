"use client"

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBoxProps {
  placeholder?: string
  className?: string
}

export default function SearchBox({ placeholder = 'Search...', className = '' }: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative group">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 z-10">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-[52px] pr-4 py-3.5 bg-white border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all rounded-full text-sm font-medium shadow-sm"
        />
      </div>
    </form>
  )
}
