'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

const MapPlaceholder = () => (
  <div className="w-full h-80 bg-slate-100 animate-pulse rounded-3xl flex items-center justify-center">
    <MarketplaceLoader />
  </div>
)

// Dynamically import the actual map component
const AdMapInner = dynamic(() => import('./AdMapInner'), {
  ssr: false,
  loading: () => <MapPlaceholder />,
})

interface AdMapProps {
  latitude: number | string | undefined | null
  longitude: number | string | undefined | null
  title?: string
  locationName?: string
}

export default function AdMap(props: AdMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !props.latitude || !props.longitude) return <MapPlaceholder />

  return <AdMapInner {...props} />
}
