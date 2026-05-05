import { Metadata } from 'next'
import SellerSetupClient from './SellerSetupClient'

export const metadata: Metadata = {
  title: 'Seller Account Setup - Tajma Marketplace',
  description: 'Complete your seller account setup to start posting ads.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SellerSetupPage() {
  return <SellerSetupClient />
}

