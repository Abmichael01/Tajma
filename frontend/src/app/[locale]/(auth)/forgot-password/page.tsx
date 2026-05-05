import { Metadata } from 'next'
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Forgot Password - Tajma Marketplace',
  description: 'Reset your Tajma Marketplace account password.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}

