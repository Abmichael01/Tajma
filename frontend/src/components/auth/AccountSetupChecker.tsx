"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import SellerSetupDialog from '@/components/modals/SellerSetupDialog'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export default function AccountSetupChecker() {
  const { user, isAuthenticated } = useAuthStore()
  const [showDialog, setShowDialog] = useState(false)
  const hasCheckedRef = useRef(false)
  const lastUserIdRef = useRef<number | null>(null)

  const getStorageKey = (id: number | string) => `seller-setup-dialog-last-shown-${id}`

  const shouldShowDialog = () => {
    if (typeof window === 'undefined' || !user) return false
    const key = getStorageKey(user.id)
    const lastShown = window.localStorage.getItem(key)
    if (!lastShown) return true
    const elapsed = Date.now() - Number(lastShown)
    return elapsed >= THREE_DAYS_MS
  }

  useEffect(() => {
    if (user && typeof user.id !== 'undefined' && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id
      hasCheckedRef.current = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user || hasCheckedRef.current) return

    const needsSetup =
      user.is_seller_account_setup === false || user.is_seller_account_setup === undefined

    if (!needsSetup) {
      hasCheckedRef.current = true
      return
    }

    if (shouldShowDialog()) {
      const timer = setTimeout(() => {
        setShowDialog(true)
        hasCheckedRef.current = true
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(getStorageKey(user.id), Date.now().toString())
        }
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      hasCheckedRef.current = true
    }
  }, [isAuthenticated, user])

  const handleClose = () => {
    setShowDialog(false)
  }

  return (
    <SellerSetupDialog 
      isOpen={showDialog} 
      onClose={handleClose} 
    />
  )
}
