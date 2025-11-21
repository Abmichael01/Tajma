import { Metadata } from 'next'
import AdsDetailClient from './AdsDetailClient'

interface AdsDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdsDetailPageProps): Promise<Metadata> {
  const { id } = await params
  // In a real app, you would fetch the ad data here to generate dynamic metadata
  return {
    title: 'Ad Details - Tajma Marketplace',
    description: 'View detailed information about this listing on Tajma Marketplace',
    openGraph: {
      title: 'Ad Details - Tajma Marketplace',
      description: 'View detailed information about this listing on Tajma Marketplace',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function AdsDetailPage({ params }: AdsDetailPageProps) {
  const { id } = await params
  return <AdsDetailClient adId={id} />
}
