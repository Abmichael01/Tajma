import { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact Us - Tajma Marketplace',
  description: 'Get in touch with Tajma Marketplace. We\'re here to help with any questions or concerns.',
  keywords: 'contact tajma, customer support, help desk',
  openGraph: {
    title: 'Contact Us - Tajma Marketplace',
    description: 'Get in touch with Tajma Marketplace support team.',
    type: 'website',
  },
}

export default function ContactPage() {
  return <ContactClient />
}

