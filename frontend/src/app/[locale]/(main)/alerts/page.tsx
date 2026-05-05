import React from 'react'
import AlertsClient from './AlertsClient'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export const metadata = {
  title: 'Alerts - Tajma Marketplace',
  description: 'View your notifications and alerts on Tajma Marketplace.',
}

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <AlertsClient />
    </ProtectedRoute>
  )
}

