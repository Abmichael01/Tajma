"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Zap, Star, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { paymentsApi } from '@/api/payments'
import { toast } from 'sonner'
import type { Ad } from '@/api/types'

interface PromoteAdModalProps {
  ad: Ad | null
  isOpen: boolean
  onClose: () => void
}

export default function PromoteAdModal({ ad, isOpen, onClose }: PromoteAdModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  if (!ad) return null

  const handlePromote = async (type: 'boost' | 'featured') => {
    setIsLoading(type)
    try {
      const response = await paymentsApi.initiatePromotion(ad.id, type)
      if (response.checkout_url) {
        // Redirect to Paystack checkout
        window.location.href = response.checkout_url
      } else {
        toast.error('Failed to get checkout URL')
      }
    } catch (error: any) {
      console.error('Promotion error:', error)
      toast.error(error?.response?.data?.error || 'Failed to initiate promotion')
    } finally {
      setIsLoading(null)
    }
  }

  const packages = [
    {
      id: 'boost',
      name: 'Ad Boost',
      price: '1,000 XOF',
      duration: '7 Days',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Move your ad to the top of the search results once and reach more buyers.',
      features: ['Priority placement', 'Highlight badge', 'Twice the views']
    },
    {
      id: 'featured',
      name: 'Featured Ad',
      price: '5,000 XOF',
      duration: '7 Days',
      icon: Star,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      description: 'Your ad will be fixed on the homepage and at the top of its category for maximum visibility.',
      features: ['Homepage placement', 'Sticky position', '10x more engagement', 'Priority support']
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary fill-primary" />
              Promote Your Ad
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Choose a promotion package for <span className="text-gray-900 font-bold">"{ad.title}"</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {packages.map((pkg) => {
              const Icon = pkg.icon
              const isProcessing = isLoading === pkg.id
              
              return (
                <div 
                  key={pkg.id}
                  className={`relative p-5 rounded-[24px] border-2 transition-all duration-200 group hover:border-primary/20 ${pkg.bgColor} border-transparent`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl bg-white shadow-sm ${pkg.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 tracking-tight">{pkg.name}</h4>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{pkg.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg text-gray-900">{pkg.price}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2 italic">
                    {pkg.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePromote(pkg.id as any)}
                    disabled={isLoading !== null}
                    className="w-full rounded-full h-12 font-bold shadow-sm transition-transform active:scale-95"
                    variant={pkg.id === 'featured' ? 'secondary' : 'primary'}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        Select {pkg.name}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 flex items-center justify-center gap-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            Secured and Powered by Paystack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
