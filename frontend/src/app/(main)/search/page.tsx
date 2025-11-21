import React from 'react'
import SearchClient from './SearchClient'

export const metadata = {
  title: 'Search Results - Tajma Marketplace',
  description: 'Find what you\'re looking for on Tajma Marketplace. Search through thousands of listings.',
  keywords: 'search, marketplace, classified ads, buy, sell',
  openGraph: {
    title: 'Search Results - Tajma Marketplace',
    description: 'Find what you\'re looking for on Tajma Marketplace. Search through thousands of listings.',
    type: 'website',
  },
}

export default function SearchPage() {
  return <SearchClient />
}
