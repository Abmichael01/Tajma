import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProfileSellerBannerProps {
  isOwner?: boolean
  sellerProfileComplete?: boolean
}

export default function ProfileSellerBanner({ isOwner, sellerProfileComplete }: ProfileSellerBannerProps) {
  if (!isOwner || sellerProfileComplete) return null

  return (
    <div className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Become a seller</p>
        <p className="text-xs text-gray-600 mt-1">
          Share contact info and business details when you're ready to start selling.
        </p>
      </div>
      <Link href="/seller/setup">
        <Button variant="outline" size="sm">
          Set up seller profile
        </Button>
      </Link>
    </div>
  )
}
