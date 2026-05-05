import React from 'react'
import ProfileClient from './ProfileClient'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export const metadata = {
  title: 'My Profile - Tajma Marketplace',
  description: 'Manage your account, ads, and preferences on Tajma Marketplace.',
  keywords: 'profile, dashboard, account, my ads, settings',
  openGraph: {
    title: 'My Profile - Tajma Marketplace',
    description: 'Manage your account, ads, and preferences on Tajma Marketplace.',
    type: 'website',
  },
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileClient />
    </ProtectedRoute>
  )
}
