"use client"

import React, { useEffect, useState, useRef } from 'react'
import { ShoppingCart } from 'lucide-react'

export default function CursorBag() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Smoothly follow cursor using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setPosition((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        
        // Smooth interpolation (easing) - adjust factor for smoother/faster following
        const factor = 0.15
        const newX = prev.x + dx * factor
        const newY = prev.y + dy * factor
        
        // Check if we're close enough to stop animating
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 0.5) {
          return { x: mousePosition.x, y: mousePosition.y }
        }
        
        return { x: newX, y: newY }
      })
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [mousePosition])

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 10}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      <ShoppingCart 
        className="w-5 h-5 text-primary drop-shadow-lg"
      />
    </div>
  )
}

