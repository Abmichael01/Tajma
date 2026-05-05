"use client"

import React, { useState } from 'react'
import ProfileMobileNav from './ProfileMobileNav'
import BackButton from '../ui/BackButton'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Calendar,
  Shield,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Phone,
  Globe,
  Mail,
  ArrowRight,
  FileText,
  BadgeCheck,
  Clock
} from 'lucide-react'
import type { User, UserWithReviewStats, Ad, Review, ReviewStats } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { getMediaUrl } from '@/lib/utils'

import KYCModal from '../modals/KYCModal'

interface ProfileHeaderProps {
  user: UserWithReviewStats
  stats: {
    rating: number
    joinedDays: number
  }
  isOwner?: boolean
  onContactClick?: () => void
  onCallClick?: () => void
  ads?: Ad[]
  adsLoading?: boolean
  reviews?: Review[]
  reviewsLoading?: boolean
  reviewStats?: ReviewStats
  profileSlug?: string
  onNavigate?: (section: string) => void
}

export default function ProfileHeader({
  user,
  stats,
  isOwner = false,
  onContactClick,
  onCallClick,
  ads = [],
  adsLoading = false,
  reviews = [],
  reviewsLoading = false,
  reviewStats,
  profileSlug = '',
  onNavigate
}: ProfileHeaderProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false)
  const fullName = getUserFullName(user)

  // Mock bio if not provided
  const bio = user.bio || "I'm a passionate seller on Tajma Marketplace, offering quality products at great prices. With years of experience in electronics and gadgets, I ensure all my items are in excellent condition. Feel free to contact me for any questions!"

  const shouldTruncate = bio.length > 120
  const displayBio = shouldTruncate && !isBioExpanded ? bio.slice(0, 120) + '...' : bio

  // Format website URL
  const formatWebsite = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  const websiteUrl = formatWebsite(user.website)

  return (
    <div className={`overflow-hidden bg-white border border-gray-200 rounded-[32px] mb-6 shadow-sm lg:mx-0`}>
        {/* Advanced Mesh Gradient Banner */}
        <div className="h-32 sm:h-44 bg-[#0f1115] relative overflow-hidden group">
          {/* Animated Mesh Elements */}
          <motion.div 
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -40, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[120px]"
          />
          
          {/* Glassy Overlay & Grain */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 via-primary/5 to-primary/20"></div>
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          
          {/* Subtle bottom fade */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

      <div className={`${isOwner ? "px-4" : "px-0"} sm:px-8 pb-6 sm:pb-8`}>
        {/* User Info Container - Overlapping with cover */}
        <div className={`relative -mt-12 sm:-mt-16 text-center flex flex-col items-center gap-4 sm:gap-6 mb-8 ${!isOwner ? "px-4" : ""}`}>
          {/* Simplified Avatar Container */}
          <div className="mx-auto sm:mx-0">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white bg-white">
              <AvatarImage src={getMediaUrl(user.avatar)} alt={fullName} />

              <AvatarFallback className="bg-gray-950 text-white text-2xl sm:text-3xl">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-col items-center gap-2 mb-3">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{fullName}</h1>
                {user.is_verified && (
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-1 fill-current" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>

              {/* Verified Badge and Stats in a row on mobile, separate on desktop? */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-semibold">{stats.rating}</span>
                </div>
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {stats.joinedDays} days on platform
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 font-medium">
              {user.location && (
                <div className="flex items-center gap-1.5 opacity-80">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-1.5 opacity-80">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Member since {new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Quick Contact for Desktop */}
          {!isOwner && (
            <div className="hidden lg:flex items-center gap-3">
              {onContactClick && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onContactClick}
                    variant="secondary"
                    className="flex items-center gap-2 rounded-full px-6 shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {/* Verification Call to Action for Owner */}
          {isOwner && !user.is_verified && (
            <div className="hidden sm:block">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setIsKYCModalOpen(true)}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/5 gap-2 rounded-full px-6 bg-primary/3"
                >
                  <BadgeCheck className="w-4 h-4" />
                  {user.kyc_status === 'pending' ? 'Pending Approval' : 'Verify Identity'}
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        <KYCModal
          isOpen={isKYCModalOpen}
          onClose={() => setIsKYCModalOpen(false)}
        />

        {/* Bio/About Section with Framer Motion */}
        <div className={`border-t border-gray-200 pt-6 mt-2 ${!isOwner ? "px-4" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-primary" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest leading-none pt-0.5">About Seller</h3>
          </div>
          <div className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={isBioExpanded ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0, height: 'auto' }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <p>
                  {isBioExpanded ? bio : displayBio}
                </p>
              </motion.div>
            </AnimatePresence>

            {shouldTruncate && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-primary hover:text-primary/80 font-semibold mt-3 flex items-center gap-1 text-sm group"
              >
                {isBioExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    Read full profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Links & Contact Info */}
        <div className={`flex flex-wrap gap-x-6 gap-y-3 mt-6 text-sm text-gray-500 font-medium ${!isOwner ? "px-4" : ""}`}>
          {websiteUrl && (
            <Link
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-primary/30">
                <Globe className="w-4 h-4" />
              </div>
              <span className="underline underline-offset-4">{user.website}</span>
            </Link>
          )}

          {user.email && isOwner && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
                <Mail className="w-4 h-4" />
              </div>
              <span>{user.email}</span>
            </div>
          )}
        </div>

        {/* Mobile Contact Actions */}
        {!isOwner && (
          <div className="sm:hidden grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-gray-50 px-4">
            {onContactClick && (
              <Button
                onClick={onContactClick}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 text-xs rounded-full py-6 shadow-sm shadow-secondary/10"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            )}
            {user.phone && onCallClick && (
              <Button
                onClick={onCallClick}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-xs rounded-full py-6 border-gray-200"
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
            )}
          </div>
        )}

        {/* Verification Call to Action for Owner (Mobile) */}
        {isOwner && !user.is_verified && (
          <div className="sm:hidden mt-8 pt-6 border-t border-gray-50">
            <Button
              onClick={() => setIsKYCModalOpen(true)}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-sm rounded-full py-6 border-primary/20 text-primary bg-primary/3"
            >
              <BadgeCheck className="w-5 h-5" />
              {user.kyc_status === 'pending' ? 'Verification Pending' : 'Verify Your Identity'}
            </Button>
          </div>
        )}
      </div>

      {/* Featured Ad Shadow Highlight on side or bottom? No, let's keep it simple for now */}
    </div>
  )
}