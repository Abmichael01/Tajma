import React from 'react'
import CategoryClient from './CategoryClient'

import { Metadata } from 'next'

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const categoryName = slug[slug.length - 1]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${categoryName} | Tajma Marketplace`,
    description: `Browse the latest listings in ${categoryName} on Tajma Marketplace. Buy and sell locally in Gambia.`,
    openGraph: {
      title: `${categoryName} | Tajma Marketplace`,
      description: `Shop for ${categoryName} items and services on Tajma. Connect with local sellers today.`,
    }
  }
}

interface CategoryPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  return <CategoryClient slug={slug} />
}

