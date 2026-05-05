"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { leadsApi } from '@/api/leads'
import { Lead, LeadMonthlyStats, LeadSource } from '@/api/types'
import { useAuthStore } from '@/store/authStore'
import { Phone, MessageSquare, Heart, User, Users, ArrowRight, Clock, ShieldCheck, Repeat2, TrendingUp, X } from 'lucide-react'
import Image from 'next/image'
import { chatApi } from '@/api/chat'
import { toast } from 'sonner'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

const SOURCE_CONFIG: Record<LeadSource, { icon: React.ReactNode; label: string }> = {
    phone_view:   { icon: <Phone className="w-3 h-3" />,  label: 'Viewed number' },
    profile_view: { icon: <User className="w-3 h-3" />,   label: 'Visited profile' },
    save_ad:      { icon: <Heart className="w-3 h-3" />,  label: 'Saved ad' },
}

function getInitials(firstName?: string, lastName?: string) {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?'
}

function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function ProfileLeads() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [leads, setLeads] = useState<Lead[]>([])
    const [monthlyStats, setMonthlyStats] = useState<LeadMonthlyStats[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) return

        const fetchData = async () => {
            try {
                const [leadsData, statsData] = await Promise.all([
                    leadsApi.list(),
                    leadsApi.monthlyStats(),
                ])
                setLeads(leadsData)
                setMonthlyStats(statsData)
            } catch {
                // silent
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [isAuthenticated])

    const handleMessage = async (lead: Lead) => {
        try {
            const response = await chatApi.getOrCreate({
                participant2_id: lead.client,
                ad_id: lead.ad || undefined
            })
            await leadsApi.markAsMessaged(lead.id)
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, messaged: true } : l))
            router.push(`/chat?id=${response.id}`)
        } catch {
            toast.error('Failed to start conversation')
        }
    }

    const handleIgnore = async (lead: Lead) => {
        try {
            await leadsApi.markIgnored(lead.id)
            setLeads(prev => prev.filter(l => l.id !== lead.id))
        } catch {
            toast.error('Failed to ignore lead')
        }
    }

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <MarketplaceLoader size="md" />
                <p className="mt-4 text-sm text-gray-500 font-medium">Loading potential clients...</p>
            </div>
        )
    }

    if (leads.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-[32px] p-6 sm:p-10 max-w-4xl mx-auto">
                <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-100 transition-transform hover:scale-105 duration-300">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
                        <Users className="w-10 h-10 text-gray-300 relative z-10" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-white">
                            0
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">No leads yet</h3>
                    <p className="text-gray-500 max-w-sm leading-relaxed text-sm mb-4">
                        Potential clients will appear here automatically when users interact with your ads or profile.
                    </p>
                </div>
            </div>
        )
    }

    const unMessaged = leads.filter(l => !l.messaged)

    return (
        <div className="bg-white border border-gray-200 rounded-[32px] p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-xl font-medium text-gray-900 tracking-tight mb-1">Potential Clients</h2>
                    <p className="text-xs text-gray-500 font-medium">Identify and connect with users interested in your items</p>
                </div>
                <div className="flex items-center gap-2">
                    {unMessaged.length > 0 && (
                        <Badge className="px-3 py-1.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-700 border-amber-200 pointer-events-none">
                            {unMessaged.length} need{unMessaged.length === 1 ? 's' : ''} a reply
                        </Badge>
                    )}
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-gray-700 bg-gray-100 border-none pointer-events-none">
                        {leads.length} Active {leads.length === 1 ? 'Lead' : 'Leads'}
                    </Badge>
                </div>
            </div>

            {/* Monthly Stats */}
            {monthlyStats.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Overview</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {monthlyStats.map((stat) => (
                            <div key={stat.month} className="flex-shrink-0 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 min-w-[150px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {formatMonth(stat.month)}
                                </p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{stat.new_leads}</p>
                                <p className="text-[10px] text-gray-400 mt-1">new lead{stat.new_leads !== 1 ? 's' : ''}</p>
                                {stat.total_interactions > stat.new_leads && (
                                    <p className="text-[10px] text-primary font-semibold mt-0.5">
                                        {stat.total_interactions} total interactions
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lead Cards */}
            <div className="grid gap-4">
                {leads.map((lead) => (
                    <div
                        key={lead.id}
                        className={cn(
                            "group bg-white border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300",
                            lead.messaged ? "border-gray-100 opacity-80" : "border-gray-200 hover:border-primary/20"
                        )}
                    >
                        {/* Avatar + Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                                {lead.client_detail?.avatar ? (
                                    <div className="p-0.5 rounded-full border-2 border-gray-50 bg-white">
                                        <Image
                                            src={getMediaUrl(lead.client_detail.avatar)}
                                            alt={lead.client_detail.first_name || 'User'}
                                            width={56}
                                            height={56}
                                            className="w-14 h-14 rounded-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/5">
                                        <span className="text-primary font-black text-base">
                                            {getInitials(lead.client_detail?.first_name, lead.client_detail?.last_name)}
                                        </span>
                                    </div>
                                )}
                                {!lead.messaged && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm animate-pulse" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className="font-black text-gray-900 text-base leading-tight">
                                        {lead.client_detail?.first_name} {lead.client_detail?.last_name}
                                    </p>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        <Clock className="w-2.5 h-2.5" />
                                        {new Date(lead.last_interacted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                {/* What they did — sources_used badges */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(lead.sources_used ?? [lead.last_source]).map((src) => {
                                        const cfg = SOURCE_CONFIG[src]
                                        if (!cfg) return null
                                        return (
                                            <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-medium text-gray-500">
                                                {cfg.icon}
                                                {cfg.label}
                                            </span>
                                        )
                                    })}

                                    {lead.interaction_count > 1 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary">
                                            <Repeat2 className="w-2.5 h-2.5" />
                                            {lead.interaction_count}×
                                        </span>
                                    )}

                                    {lead.ad_detail && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-medium text-gray-400 max-w-[200px] truncate">
                                            Re: {lead.ad_detail.title}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 md:ml-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                            {lead.messaged ? (
                                <Badge variant="secondary" className="h-9 px-4 rounded-full font-bold text-[11px] text-emerald-600 bg-emerald-50 border-emerald-100/50 pointer-events-none">
                                    <ShieldCheck className="w-3 h-3 mr-1.5" />
                                    Conversing
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="h-9 px-4 rounded-full font-bold text-[11px] text-primary bg-primary/5 border-primary/10 pointer-events-none">
                                    New Inquiry
                                </Badge>
                            )}

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={() => handleMessage(lead)}
                                    className="flex-1 sm:flex-none h-10 px-5 rounded-full bg-gray-900 hover:bg-black text-white text-xs font-bold group/btn"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-2 transition-transform group-hover/btn:-rotate-6" />
                                    Message
                                    <ArrowRight className="w-3 h-3 ml-1.5 transition-transform group-hover/btn:translate-x-1" />
                                </Button>

                                {lead.client_detail?.phone && (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="h-10 px-4 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold"
                                    >
                                        <a href={`tel:${lead.client_detail.phone}`}>
                                            <Phone className="w-3.5 h-3.5" />
                                        </a>
                                    </Button>
                                )}

                                {!lead.messaged && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleIgnore(lead)}
                                        className="h-10 w-10 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-50 flex-shrink-0"
                                        title="Ignore this lead"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 flex items-center justify-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
                    Sorted by most recent activity
                </p>
            </div>
        </div>
    )
}
