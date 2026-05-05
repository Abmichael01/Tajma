"use client"

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'

interface AdminStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  href?: string
  percentage?: number
  isPrimary?: boolean
  period?: string
}

export default function AdminStatsCard({
  title,
  value,
  icon: Icon,
  href,
  percentage,
  isPrimary = false,
  period = "vs last month",
}: AdminStatsCardProps) {
  const isPositive = percentage !== undefined ? percentage >= 0 : null
  const bgClass = isPrimary 
    ? 'bg-primary border-none' 
    : 'bg-white border-gray-200'
  const textClass = isPrimary 
    ? 'text-white' 
    : 'text-gray-900'
  const titleClass = isPrimary 
    ? 'text-white/80' 
    : 'text-gray-500'
  const iconBgClass = isPrimary 
    ? 'bg-white' 
    : 'border border-primary bg-transparent'
  const iconClass = isPrimary 
    ? 'text-primary' 
    : 'text-primary'

  const content = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`${bgClass} border rounded-2xl p-5 hover:shadow-md transition-all duration-200`}
    >
      {/* Top row: title + icon on same line */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className={`text-xs md:text-sm font-medium tracking-wide ${titleClass} uppercase`}>
          {title}
        </p>
        <div className={`${iconBgClass} rounded-full flex items-center justify-center w-9 h-9`}>
          <Icon className={`w-4 h-4 ${iconClass}`} />
        </div>
      </div>
      
      {/* Big value with glow effect */}
      <div className="relative">
        {/* Blurred circle glow behind value */}
        {isPrimary && (
          <div 
            className="absolute -left-8 -top-4 w-24 h-24 rounded-full bg-blue-300 blur-2xl opacity-40 pointer-events-none"
            // style={{
            //   background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(147, 197, 253, 0.4) 50%, transparent 70%)',
            // }}
          />
        )}
        <p className={`relative text-3xl md:text-4xl leading-tight ${textClass}`}>
        {value}
      </p>
      </div>
      
      {percentage !== undefined && (
        <div className="flex items-center gap-1.5 pt-2">
          <div className={`flex items-center gap-1 ${isPrimary ? 'text-white/90' : isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-[11px] font-semibold">
              {Math.abs(percentage)}%
            </span>
          </div>
          <span className={`text-[11px] ${isPrimary ? 'text-white/75' : 'text-gray-400'}`}>
            {period}
          </span>
        </div>
      )}
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
  
}

 