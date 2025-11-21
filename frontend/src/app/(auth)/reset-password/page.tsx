import { Metadata } from 'next'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Reset Password - Tajma Marketplace',
  description: 'Create a new password for your Tajma Marketplace account.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}

