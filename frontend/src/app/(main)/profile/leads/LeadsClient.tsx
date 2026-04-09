"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { leadsApi, type Lead, type LeadMonthlyStats } from '@/api/leads'
import { LeadSource } from '@/api/types'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, MessageSquare, Heart, User, Repeat2, TrendingUp, X } from 'lucide-react'
import Image from 'next/image'
import { chatApi } from '@/api/chat'
import { toast } from 'sonner'

const SOURCE_CONFIG: Record<LeadSource, { label: string; icon: React.ReactNode }> = {
    phone_view:   { label: 'Viewed number',          icon: <Phone className="w-3.5 h-3.5" /> },
    profile_view: { label: 'Visited profile', icon: <User className="w-3.5 h-3.5" /> },
    save_ad:      { label: 'Saved ad',        icon: <Heart className="w-3.5 h-3.5" /> },
}

function getInitials(firstName?: string, lastName?: string) {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?'
}

function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function LeadsClient() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [leads, setLeads] = useState<Lead[]>([])
    const [monthlyStats, setMonthlyStats] = useState<LeadMonthlyStats[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            try {
                const [leadsData, statsData] = await Promise.all([
                    leadsApi.list(),
                    leadsApi.monthlyStats(),
                ])
                setLeads(leadsData)
                setMonthlyStats(statsData)
            } catch (error) {
                console.error('Error fetching leads:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [isAuthenticated, router])

    const handleMessage = async (lead: Lead) => {
        try {
            const response = await chatApi.getOrCreate({
                participant2_id: lead.client,
                ad_id: lead.ad || undefined
            })
            await leadsApi.markAsMessaged(lead.id)
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, messaged: true } : l))
            router.push(`/chat?id=${response.id}`)
        } catch (error) {
            console.error('Error starting chat:', error)
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
        return <div className="container py-8 text-center"><p>Loading your leads...</p></div>
    }

    return (
        <div className="container py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Potential Clients</h1>
                <Badge variant="outline" className="text-lg px-4 py-1 pointer-events-none">
                    {leads.length} Leads
                </Badge>
            </div>

            {/* Monthly Stats */}
            {monthlyStats.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-500">Monthly Overview</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {monthlyStats.map((stat) => (
                            <div key={stat.month} className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 min-w-[160px]">
                                <p className="text-xs font-semibold text-gray-400 mb-1">{formatMonth(stat.month)}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.new_leads}</p>
                                <p className="text-xs text-gray-400">new lead{stat.new_leads !== 1 ? 's' : ''}</p>
                                {stat.total_interactions > stat.new_leads && (
                                    <p className="text-xs text-blue-500 font-medium mt-0.5">
                                        {stat.total_interactions} interactions
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {leads.length === 0 ? (
                <Card className="text-center p-12">
                    <CardContent>
                        <div className="flex justify-center mb-4">
                            <User className="w-16 h-16 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-lg">You don't have any potential clients yet.</p>
                        <p className="text-gray-400 mt-2">Leads appear when users interact with your ads or profile.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {leads.map((lead) => (
                        <Card key={lead.id} className="overflow-hidden">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {lead.client_detail?.avatar ? (
                                        <Image
                                            src={lead.client_detail.avatar}
                                            alt={lead.client_detail.first_name}
                                            width={56}
                                            height={56}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-lg">
                                                {getInitials(lead.client_detail?.first_name, lead.client_detail?.last_name)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {lead.client_detail?.first_name} {lead.client_detail?.last_name}
                                        </h3>
                                        {/* What they did */}
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {(lead.sources_used ?? [lead.last_source]).map((src) => {
                                                const cfg = SOURCE_CONFIG[src]
                                                if (!cfg) return null
                                                return (
                                                    <span key={src} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                                        {cfg.icon}
                                                        {cfg.label}
                                                    </span>
                                                )
                                            })}
                                            {lead.interaction_count > 1 && (
                                                <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 font-medium">
                                                    <Repeat2 className="w-3 h-3" />
                                                    {lead.interaction_count}×
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Last seen {new Date(lead.last_interacted_at).toLocaleDateString()}
                                            {lead.ad_detail && ` · ${lead.ad_detail.title}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {lead.messaged ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none pointer-events-none">
                                            Messaged
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none pointer-events-none">
                                            New Lead
                                        </Badge>
                                    )}
                                    <Button size="sm" onClick={() => handleMessage(lead)} className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Message
                                    </Button>
                                    {lead.client_detail?.phone && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.location.href = `tel:${lead.client_detail?.phone}`}
                                        >
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {!lead.messaged && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleIgnore(lead)}
                                            className="text-gray-400 hover:text-gray-600"
                                            title="Ignore"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
