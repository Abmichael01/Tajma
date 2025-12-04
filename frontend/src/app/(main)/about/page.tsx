import { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About Us - Tajma Marketplace',
  description: 'Learn about Tajma Marketplace, Niger\'s trusted online marketplace connecting buyers and sellers nationwide.',
  keywords: 'about tajma, online marketplace niger, classified ads platform',
  openGraph: {
    title: 'About Us - Tajma Marketplace',
    description: 'Learn about Tajma Marketplace, Niger\'s trusted online marketplace.',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutClient />
}

