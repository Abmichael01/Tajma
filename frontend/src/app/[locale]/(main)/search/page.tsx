import React from 'react'
import SearchClient from './SearchClient'

import { Metadata } from 'next'

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q : ''
  
  const title = query 
    ? `Search results for "${query}" | Tajma` 
    : 'Search Listings | Tajma Marketplace'
    
  const description = query
    ? `Browse all listings matching "${query}" on Tajma Marketplace. find the best deals from verified local sellers.`
    : 'Search through thousands of listings on Tajma Marketplace. Find electronics, fashion, vehicles, and more.'

  return {
    title,
    description,
    keywords: `search, ${query}, marketplace, classified ads, buy, sell, gambia`,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    }
  }
}

export default function SearchPage() {
  return <SearchClient />
}
