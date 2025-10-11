"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './input'
import { Button } from './button'
import { Search } from 'lucide-react'

interface SearchBoxClientProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export default function SearchBox({ 
  placeholder = "Search for anything...", 
  className = "",
  onSearch 
}: SearchBoxClientProps) {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const query = formData.get('search') as string
    
    if (onSearch) {
      onSearch(query)
    } else {
      // Navigate to search page with query
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      } else {
        router.push('/search')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        name="search"
        type="text"
        placeholder={placeholder}
        className="pr-12"
      />
      <Button 
        type="submit"
        className="absolute right-0 top-0 h-full px-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        size="icon"
      >
        <Search className="w-5 h-5" />
      </Button>
    </form>
  )
}
