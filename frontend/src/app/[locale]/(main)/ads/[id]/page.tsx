import { Metadata } from 'next'
import AdsDetailClient from './AdsDetailClient'

const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tajma.net'

interface AdsDetailPageProps {
  params: Promise<{ id: string }>
}

async function getAd(id: string) {
  try {
    const res = await fetch(`${EXTERNAL_DATA_URL}/api/ads/${id}/`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Metadata Fetch Error:', error)
    return null
  }
}

export async function generateMetadata({ params }: AdsDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const ad = await getAd(id)

  if (!ad) {
    return {
      title: 'Ad Not Found',
      description: 'The requested listing could not be found.',
    }
  }

  const title = `${ad.title} - ${ad.currency} ${parseFloat(ad.price).toLocaleString()}`
  const description = ad.description ? ad.description.slice(0, 160) : `View ${ad.title} on Tajma Marketplace. Fast, safe, and local.`
  const imageUrl = ad.images && ad.images.length > 0 ? ad.images[0] : '/logo_new.png'

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/ads/${ad.slug || ad.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/ads/${ad.slug || ad.id}`,
      siteName: 'Tajma Marketplace',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: ad.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function AdsDetailPage({ params }: AdsDetailPageProps) {
  const { id } = await params
  const adContext = await getAd(id)

  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = adContext ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: adContext.title,
    image: adContext.images,
    description: adContext.description,
    brand: {
      '@type': 'Brand',
      name: 'Tajma Marketplace',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/ads/${adContext.slug || adContext.id}`,
      priceCurrency: adContext.currency || 'XOF',
      price: adContext.price,
      itemCondition: 'https://schema.org/UsedCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: adContext.seller_name || 'Verified Seller',
      },
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AdsDetailClient adId={id} />
    </>
  )
}
