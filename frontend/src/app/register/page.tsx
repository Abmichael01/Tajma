import { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Sign Up - Tajma Marketplace',
  description: 'Create your free Tajma Marketplace account to start buying and selling.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}

