import { Metadata } from 'next'
import TermsClient from './TermsClient'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Tajma Marketplace',
  description: 'Read Tajma Marketplace terms and conditions for using our platform.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return <TermsClient />
}

