"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { leadsApi, Lead } from '@/api/leads'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, MessageSquare, Heart, User, ExternalLink, Mail } from 'lucide-react'
import Image from 'next/image'
import { chatApi } from '@/api/chat'
import { toast } from 'sonner'

export default function LeadsClient() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuthStore()
    const [leads, setLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchLeads = async () => {
            try {
                const data = await leadsApi.list()
                setLeads(data)
            } catch (error) {
                console.error('Error fetching leads:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLeads()
    }, [isAuthenticated, router])

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'phone_view': return <Phone className="w-4 h-4" />
            case 'profile_view': return <User className="w-4 h-4" />
            case 'save_ad': return <Heart className="w-4 h-4" />
            default: return <ExternalLink className="w-4 h-4" />
        }
    }

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'phone_view': return 'Viewed Phone'
            case 'profile_view': return 'Viewed Profile'
            case 'save_ad': return 'Saved Ad'
            default: return 'Interacted'
        }
    }

    const handleMessage = async (lead: Lead) => {
        try {
            const response = await chatApi.getOrCreate({
                participant2_id: lead.client,
                ad_id: lead.ad || undefined
            })

            await leadsApi.markAsMessaged(lead.id)

            // Update local state
            setLeads(leads.map(l => l.id === lead.id ? { ...l, messaged: true } : l))

            router.push(`/chat?id=${response.id}`)
        } catch (error) {
            console.error('Error starting chat:', error)
            toast.error('Failed to start conversation')
        }
    }

    if (isLoading) {
        return (
            <div className="container py-8 text-center">
                <p>Loading your leads...</p>
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Potential Clients</h1>
                <Badge variant="outline" className="text-lg px-4 py-1">
                    {leads.length} Leads
                </Badge>
            </div>

            {leads.length === 0 ? (
                <Card className="text-center p-12">
                    <CardContent>
                        <div className="flex justify-center mb-4">
                            <User className="w-16 h-16 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-lg">You don't have any potential clients yet.</p>
                        <p className="text-gray-400 mt-2">Leads will appear here when users interact with your ads or profile.</p>
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
                                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {lead.client_detail?.first_name} {lead.client_detail?.last_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                            <span className="flex items-center gap-1">
                                                {getSourceIcon(lead.source)}
                                                {getSourceLabel(lead.source)}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {lead.ad_detail && (
                                        <div className="text-sm text-gray-600 mb-2">
                                            Interested in: <span className="font-semibold">{lead.ad_detail.title}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {lead.messaged ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                Messaged
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                                                New Lead
                                            </Badge>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => handleMessage(lead)}
                                            className="flex items-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Message
                                        </Button>
                                        {lead.client_detail?.phone && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-2"
                                                onClick={() => window.location.href = `tel:${lead.client_detail?.phone}`}
                                            >
                                                <Phone className="w-4 h-4" />
                                                Call
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
