import React from 'react'
import { notFound } from 'next/navigation'
import CategoryClient from './CategoryClient'

interface CategoryPageProps {
  params: Promise<{
    'category-slug': string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { 'category-slug': categorySlug } = await params
  const categoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace('-', ' ')
  
  return {
    title: `${categoryName} - Tajma Marketplace`,
    description: `Browse ${categoryName.toLowerCase()} listings on Tajma Marketplace. Find great deals and connect with sellers.`,
    keywords: `${categoryName.toLowerCase()}, marketplace, classified ads, buy, sell`,
    openGraph: {
      title: `${categoryName} - Tajma Marketplace`,
      description: `Browse ${categoryName.toLowerCase()} listings on Tajma Marketplace. Find great deals and connect with sellers.`,
      type: 'website',
    },
  }
}

// Valid category slugs
const validCategories = [
  'electronics',
  'vehicles', 
  'real-estate',
  'jobs',
  'services',
  'fashion',
  'sports',
  'home-garden'
]

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { 'category-slug': categorySlug } = await params
  
  // Check if category is valid
  if (!validCategories.includes(categorySlug)) {
    notFound()
  }
  
  return <CategoryClient categorySlug={categorySlug} />
}
