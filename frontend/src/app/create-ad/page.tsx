import { Metadata } from 'next'
import CreateAdClient from './CreateAdClient'

export const metadata: Metadata = {
  title: 'Post Ad - Tajma Marketplace',
  description: 'Create a new listing or post a service need on Tajma Marketplace',
  openGraph: {
    title: 'Post Ad - Tajma Marketplace',
    description: 'Create a new listing or post a service need on Tajma Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Post Ad - Tajma Marketplace',
    description: 'Create a new listing or post a service need on Tajma Marketplace',
  },
  robots: {
    index: false, // Don't index this page
    follow: false,
  },
}

export default function CreateAdPage() {
  return <CreateAdClient />
}

