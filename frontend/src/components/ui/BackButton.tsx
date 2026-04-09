"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  className?: string
  onClick?: () => void
  iconOnly?: boolean
  variant?: 'outline' | 'glass'
}

export default function BackButton({ 
  className = '', 
  onClick, 
  iconOnly = false,
  variant = 'outline'
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  const variantClasses = {
    outline: "flex rounded-full border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
    glass: "flex rounded-full border border-white/20 bg-black/10 backdrop-blur-md text-white hover:bg-black/20"
  }

  return (
    <Button
      variant={variant === 'glass' ? 'ghost' : 'outline'}
      onClick={handleClick}
      className={cn(
        "flex rounded-full items-center justify-center p-2 h-10 w-10 transition-colors",
        variant === 'outline' && "border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
        variant === 'glass' && "border border-white/20 bg-black/10 backdrop-blur-md text-white hover:bg-black/20 hover:border-white/40",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  )
}

