import { Metadata } from 'next'
import HelpClient from './HelpClient'

export const metadata: Metadata = {
  title: 'Help & FAQ - Tajma Marketplace',
  description: 'Find answers to frequently asked questions about using Tajma Marketplace.',
  keywords: 'help, faq, support, how to, guide',
  openGraph: {
    title: 'Help & FAQ - Tajma Marketplace',
    description: 'Get help and find answers to common questions.',
    type: 'website',
  },
}

export default function HelpPage() {
  return <HelpClient />
}

