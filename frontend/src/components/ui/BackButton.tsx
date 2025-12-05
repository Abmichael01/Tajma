"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from './button'

interface BackButtonProps {
  className?: string
  onClick?: () => void
}

export default function BackButton({ className = '', onClick }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={`hidden md:flex rounded-full border items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Button>
  )
}

