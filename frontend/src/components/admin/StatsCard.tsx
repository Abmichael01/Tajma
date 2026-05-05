"use client"

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  href?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  description?: string
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  description,
}: StatsCardProps) {
  const content = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-md p-5 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-2xl font-medium text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1.5">{description}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-2.5 bg-primary/5 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
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
