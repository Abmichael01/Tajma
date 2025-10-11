"use client"

import { useState, useEffect } from 'react'

export function useNavbarHeight() {
  const [navbarHeight, setNavbarHeight] = useState(0)

  useEffect(() => {
    const calculateNavbarHeight = () => {
      const navbar = document.querySelector('header')
      if (navbar) {
        const height = navbar.offsetHeight
        setNavbarHeight(height)
      }
    }

    // Calculate on mount
    calculateNavbarHeight()

    // Recalculate on window resize (in case navbar height changes)
    window.addEventListener('resize', calculateNavbarHeight)

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateNavbarHeight)
    }
  }, [])

  return navbarHeight
}
