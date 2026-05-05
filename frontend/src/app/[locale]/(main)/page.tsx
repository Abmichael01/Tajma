import React from 'react'
import HomeClient from './HomeClient'

export const metadata = {
  title: 'Tajma Marketplace - Find the Right Seller for What You Want',
  description: 'Connect with verified sellers, discover amazing deals, and get exactly what you\'re looking for in your local marketplace. Join 10K+ active sellers and 50K+ products.',
  keywords: 'marketplace, local sellers, verified deals, online shopping, classified ads, buy and sell',
  openGraph: {
    title: 'Tajma Marketplace - Find the Right Seller for What You Want',
    description: 'Connect with verified sellers, discover amazing deals, and get exactly what you\'re looking for in your local marketplace.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tajma Marketplace - Find the Right Seller for What You Want',
    description: 'Connect with verified sellers, discover amazing deals, and get exactly what you\'re looking for in your local marketplace.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Home() {
  return <HomeClient />
}
