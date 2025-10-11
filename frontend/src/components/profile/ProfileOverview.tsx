"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Eye, 
  Heart,
  MessageSquare,
  TrendingUp, 
  Star,
  ShoppingBag,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'

interface ProfileOverviewProps {
  stats: {
    totalAds: number
    activeAds: number
    soldItems: number
    totalViews: number
    totalFavorites: number
    responseRate: number
    rating: number
    joinedDays: number
  }
  isOwner?: boolean
  userUid?: string
}

export default function ProfileOverview({ stats, isOwner = false, userUid }: ProfileOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalAds}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Ads</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-secondary">{stats.activeAds}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Active Ads</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Views</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.rating}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Rating</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalFavorites}</p>
              <p className="text-xs text-gray-600">Favorites</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.soldItems}</p>
              <p className="text-xs text-gray-600">Sold Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.responseRate}%</p>
              <p className="text-xs text-gray-600">Response Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.joinedDays}</p>
              <p className="text-xs text-gray-600">Days Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {isOwner && (
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Performance Overview
            </h3>
            <Link href={`/profile/${userUid}?tab=ads`}>
              <Button variant="ghost" size="sm">
                View All Ads
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50">
              <p className="text-xs text-gray-600 mb-1">Avg. Views per Ad</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(stats.totalViews / (stats.totalAds || 1))}
              </p>
            </div>
            <div className="p-3 bg-gray-50">
              <p className="text-xs text-gray-600 mb-1">Avg. Favorites</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(stats.totalFavorites / (stats.totalAds || 1))}
              </p>
            </div>
            <div className="p-3 bg-gray-50 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-600 mb-1">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((stats.soldItems / (stats.totalAds || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isOwner && (
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/create-ad">
              <Button variant="primary" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Post New Ad
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Messages
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          {isOwner ? 'Your Performance' : 'Seller Performance'}
        </h4>
        <ul className="space-y-2 text-xs sm:text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{stats.responseRate}% response rate to inquiries</span>
          </li>
          <li className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>{stats.rating}/5.0 average seller rating</span>
          </li>
          <li className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>{stats.soldItems} successful transactions</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
