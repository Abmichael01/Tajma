"use client"

import { useState, useEffect } from 'react'

export function useBottomNavHeight() {
  const [bottomNavHeight, setBottomNavHeight] = useState(0)

  useEffect(() => {
    const calculateBottomNavHeight = () => {
      const bottomNav = document.querySelector('#mobile-bottom-nav')
      if (bottomNav) {
        const height = bottomNav.offsetHeight
        setBottomNavHeight(height)
      }
    }

    // Calculate on mount
    calculateBottomNavHeight()

    // Recalculate on window resize
    window.addEventListener('resize', calculateBottomNavHeight)

    // Also observe for visibility changes (in case it's hidden/shown)
    const observer = new MutationObserver(calculateBottomNavHeight)
    const bottomNav = document.querySelector('#mobile-bottom-nav')
    if (bottomNav) {
      observer.observe(bottomNav, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: false,
        subtree: false,
      })
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateBottomNavHeight)
      observer.disconnect()
    }
  }, [])

  return bottomNavHeight
}


