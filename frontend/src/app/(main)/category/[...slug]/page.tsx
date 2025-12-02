import React from 'react'
import CategoryClient from './CategoryClient'

export const metadata = {
  title: 'Category - Tajma Marketplace',
  description: 'Browse ads by category on Tajma Marketplace.',
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

