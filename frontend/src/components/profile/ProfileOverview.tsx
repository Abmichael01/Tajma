"use client"

import React from 'react'
import { Link } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
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
  BarChart3,
  Shield,
  ArrowUpRight
} from 'lucide-react'
import { useTranslations } from 'next-intl'

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

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "primary"
}: {
  icon: any
  label: string
  value: string | number
  subtitle?: string
  color?: "primary" | "secondary"
}) => {
  const colorClasses = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    secondary: "border-gray-200 bg-gray-50 text-gray-400"
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      className="group relative border border-gray-200 bg-white p-5 rounded-2xl hover:border-primary/10 transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 mb-1 truncate">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight truncate">{value}</p>
          {subtitle && <p className="mt-1 text-[10px] text-gray-400 font-medium truncate">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0 ml-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProfileOverview({ stats, isOwner = false, userUid }: ProfileOverviewProps) {
  const t = useTranslations('profile')
  const [isStatsExpanded] = React.useState(true)

  const allStats = [
    { icon: FileText, label: t('total_ads'), value: stats.totalAds.toLocaleString(), color: "primary" as const },
    { icon: Eye, label: t('views'), value: stats.totalViews.toLocaleString(), color: "primary" as const },
    { icon: TrendingUp, label: t('ads'), value: stats.activeAds.toLocaleString(), color: "primary" as const },
    { icon: MessageSquare, label: t('response_rate'), value: `${stats.responseRate}%`, color: "primary" as const },
    { icon: Clock, label: t('days_active'), value: stats.joinedDays.toLocaleString(), color: "secondary" as const },
    { icon: Heart, label: t('favorites'), value: stats.totalFavorites.toLocaleString(), color: "secondary" as const },
    { icon: CheckCircle, label: t('sold_items'), value: stats.soldItems.toLocaleString(), color: "secondary" as const },
    { icon: Star, label: t('seller_rating'), value: stats.rating.toFixed(1), subtitle: t('out_of_5'), color: "secondary" as const }
  ]

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" className="space-y-8">
      <AnimatePresence initial={false}>
        {isStatsExpanded && (
          <motion.div key="stats-grid" initial={{ height: 0, opacity: 0, marginBottom: 0 }} animate={{ height: 'auto', opacity: 1, marginBottom: 32 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
              {allStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {isOwner && (
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border border-gray-200 bg-white p-6 sm:p-8 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/5 text-secondary"><BarChart3 className="h-6 w-6" /></span>
                <div><h3 className="text-sm font-semibold text-gray-500">{t('global_performance')}</h3><p className="text-xs text-gray-400 font-medium mt-0.5">{t('last_30_days')}</p></div>
              </div>
              <Link href={`/profile/${userUid}?tab=ads`}><Button variant="outline" size="sm" className="rounded-full px-6 group font-bold text-xs uppercase tracking-wider">{t('details')}<ArrowUpRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button></Link>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              <div className="bg-gray-50/50 border border-gray-200 px-6 py-5 rounded-2xl hover:bg-white hover:border-primary/20 transition-all duration-300">
                <p className="text-[10px] font-bold text-gray-400 mb-1 leading-none">{t('avg_views_ad')}</p>
                <div className="flex items-baseline gap-2 mt-2"><p className="text-3xl font-bold text-gray-900 tracking-tight">{Math.round(stats.totalViews / (stats.totalAds || 1))}</p></div>
              </div>
              <div className="bg-gray-50/50 border border-gray-200 px-6 py-5 rounded-2xl hover:bg-white hover:border-primary/20 transition-all duration-300">
                <p className="text-[10px] font-bold text-gray-400 mb-1 leading-none">{t('engage_rate')}</p>
                <div className="flex items-baseline gap-2 mt-2"><p className="text-3xl font-bold text-gray-900 tracking-tight">{Math.round(stats.totalFavorites / (stats.totalAds || 1))}</p></div>
              </div>
              <div className="bg-gray-50/50 border border-gray-200 px-6 py-5 rounded-2xl hover:bg-white hover:border-primary/20 transition-all duration-300">
                <p className="text-[10px] font-bold text-gray-400 mb-1 leading-none">{t('conversion')}</p>
                <div className="flex items-baseline gap-2 mt-2"><p className="text-3xl font-bold text-gray-900 tracking-tight">{Math.round((stats.soldItems / (stats.totalAds || 1)) * 100)}%</p></div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isOwner && (
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="bg-secondary text-white p-6 sm:p-8 rounded-[32px] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag className="w-24 h-24" /></div>
              <div className="relative z-10"><h3 className="text-lg font-semibold tracking-tight mb-2">{t('grow_sales_title')}</h3><p className="text-xs text-white/60 font-medium leading-relaxed max-w-[200px]">{t('grow_sales_desc')}</p></div>
              <div className="relative z-10 space-y-3 mt-6">
                <Link href="/create-ad"><Button variant="primary" className="w-full rounded-full py-6 font-bold text-sm bg-white text-secondary hover:bg-white/90 border-0">{t('post_new_ad')}</Button></Link>
                <Link href="/chat"><Button variant="ghost" className="w-full rounded-full py-6 font-bold text-sm text-white hover:bg-white/10">{t('messages')}</Button></Link>
              </div>
            </motion.div>
          )}
          {isOwner && stats.rating < 4 && (
            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="bg-primary text-white p-6 sm:p-8 rounded-[32px] relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-24 h-24" /></div>
              <div className="relative z-10"><h4 className="font-semibold text-white text-lg tracking-tight mb-2">{t('boost_trust_title')}</h4><p className="text-xs text-white/60 font-medium leading-relaxed max-w-[200px]">{t('boost_trust_desc')}</p></div>
              <Link href={`/profile/${userUid}?tab=settings`} className="mt-6 block relative z-10"><Button variant="primary" className="w-full rounded-full py-6 font-bold text-sm bg-white text-primary hover:bg-white/90 border-0">{t('get_verified')}</Button></Link>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="pt-4">
        <div className="bg-gray-50/50 border border-gray-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">{[1, 2, 3].map((i) => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />)}<div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">+{stats.totalViews > 1000 ? '1k' : stats.totalViews}</div></div>
            <div><p className="text-sm font-bold text-gray-900 leading-none">{t('trust_score')}</p><div className="flex items-center gap-1.5 mt-1"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= Math.round(stats.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} />)}</div><span className="text-xs font-bold text-gray-500 tracking-tight">{stats.rating}/5.0</span></div></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-bold text-gray-600 leading-none mt-0.5">{t('responsive', { rate: stats.responseRate })}</span></div>
            <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-primary" /><span className="text-xs font-bold text-gray-600 leading-none mt-0.5">{t('transactions', { count: stats.soldItems })}</span></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
