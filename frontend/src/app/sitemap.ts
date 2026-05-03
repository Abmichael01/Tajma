import { MetadataRoute } from 'next'

// Standard marketplace page URLs
const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tajma.net'

async function getCategories() {
  try {
    const res = await fetch(`${EXTERNAL_DATA_URL}/api/categories/tree/`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch (error) {
    console.error('Sitemap Categories Fetch Error:', error)
    return []
  }
}

async function getAds() {
  try {
    // We only want to index published ads
    const res = await fetch(`${EXTERNAL_DATA_URL}/api/ads/?page_size=1000&status=published`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    // Handle both direct array and paginated results
    return data.results || data || []
  } catch (error) {
    console.error('Sitemap Ads Fetch Error:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, ads] = await Promise.all([
    getCategories(),
    getAds(),
  ])

  // Helper to flatten category tree
  const flattenedCategories: any[] = []
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      flattenedCategories.push(node)
      if (node.children && node.children.length > 0) flatten(node.children)
      if (node.subcategories && node.subcategories.length > 0) flatten(node.subcategories)
    })
  }
  flatten(categories)

  const categoryEntries = flattenedCategories.map((cat: any) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const adEntries = ads.map((ad: any) => ({
    url: `${SITE_URL}/ads/${ad.slug || ad.id}`,
    lastModified: new Date(ad.updated_at || ad.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    ...categoryEntries,
    ...adEntries,
  ]
}
