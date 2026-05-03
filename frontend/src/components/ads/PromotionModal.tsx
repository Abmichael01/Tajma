"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, TrendingUp, Zap, ChevronRight, Check, X } from 'lucide-react'
import { paymentsApi } from '@/api/payments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PromotionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adId: string
  adTitle: string
}

type DurationType = number

export default function PromotionModal({ open, onOpenChange, adId, adTitle }: PromotionModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingPackages, setFetchingPackages] = useState(true)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedDuration, setSelectedDuration] = useState<DurationType>(7)
  const [selectedTier, setSelectedTier] = useState<'boost' | 'featured'>('boost')

  useEffect(() => {
    const fetchPackages = async () => {
      setFetchingPackages(true)
      try {
        const data = await paymentsApi.getPromotionPackages()
        setPackages(data)
        
        // Try to select a default duration that exists for the default tier
        const boostPackages = data.filter((p: any) => p.promotion_type === 'boost')
        if (boostPackages.length > 0) {
            // Find 7 days or first available
            const defaultPkg = boostPackages.find((p: any) => p.duration_days === 7) || boostPackages[0]
            setSelectedDuration(defaultPkg.duration_days)
        }
      } catch (error) {
        console.error('Error fetching packages:', error)
      } finally {
        setFetchingPackages(false)
      }
    }

    if (open) {
      fetchPackages()
    }
  }, [open])

  // Get available durations for current tier
  const availablePackages = packages.filter(p => p.promotion_type === selectedTier)
  const availableDurations = Array.from(new Set(availablePackages.map(p => p.duration_days))).sort((a, b) => a - b)
  
  // Current selected package
  const currentPackage = availablePackages.find(p => p.duration_days === selectedDuration) || availablePackages[0]

  const handlePromote = async () => {
    if (!currentPackage) return

    setLoading(true)
    try {
      const response = await paymentsApi.initiatePromotion(adId, selectedTier, selectedDuration)
      if (response.checkout_url) {
        window.location.href = response.checkout_url
      } else {
        toast.error('Failed to get checkout URL')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to initiate promotion')
      console.error('Promotion error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none focus-visible:outline-none">
        
        {/* Seedance-Style Container (Deep Black #0A0A0A) */}
        <div className="relative bg-[#0A0A0A] rounded-[32px] overflow-hidden border border-[#222] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col">
          
          {/* Top Badge Overlay */}
          <div className={cn(
             "w-full h-10 flex items-center justify-center text-[10px] font-black tracking-[0.2em] text-white uppercase transition-all duration-500",
             selectedTier === 'featured' ? "bg-blue-600 shadow-[0_4px_15px_rgba(37,99,235,0.4)]" : "bg-pink-600 shadow-[0_4px_15px_rgba(219,39,119,0.4)]"
          )}>
            {selectedTier === 'featured' ? <><Sparkles className="w-3 h-3 mr-2" /> BEST VALUE</> : <><TrendingUp className="w-3 h-3 mr-2" /> MOST POPULAR</>}
          </div>

          <div className="p-8 space-y-8">
            {/* Header: Seedance Style */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter leading-none">
                    {selectedTier === 'featured' ? 'ELITE' : 'ULTRA'} <span className="text-primary italic">2.0</span>
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black text-white transition-colors duration-500", selectedTier === 'featured' ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400")}>
                        {adTitle.toUpperCase()}
                    </div>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} className="text-[#444] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {fetchingPackages ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black text-[#444] tracking-widest uppercase">Fetching Elite Tiers...</p>
                </div>
            ) : (
                <>
                    {/* Tier Toggle (SaaS style) */}
                    <div className="bg-[#111] p-1 rounded-2xl flex gap-1 border border-[#222]">
                        {(['boost', 'featured'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setSelectedTier(t)
                                    // Update duration if current one isn't available for new tier
                                    const tierPackages = packages.filter(p => p.promotion_type === t)
                                    if (!tierPackages.some(p => p.duration_days === selectedDuration)) {
                                        setSelectedDuration(tierPackages[0]?.duration_days || 7)
                                    }
                                }}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2",
                                    selectedTier === t 
                                        ? "bg-[#222] text-white shadow-xl ring-1 ring-white/10" 
                                        : "text-[#555] hover:text-[#888]"
                                )}
                            >
                                {t === 'boost' ? 'BOOST' : 'FEATURED'}
                            </button>
                        ))}
                    </div>

                    {/* Price Visualization Card */}
                    <div className={cn(
                    "relative p-1 rounded-[24px] overflow-hidden transition-all duration-500",
                    selectedTier === 'featured' ? "bg-gradient-to-br from-blue-500 via-blue-400 to-indigo-600" : "bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600"
                    )}>
                        <div className="bg-[#111] rounded-[22px] p-6 space-y-4">
                            <div className="flex items-baseline gap-2">
                                {currentPackage?.discount_price && (
                                    <span className="text-gray-600 text-xl font-black line-through opacity-50">
                                        XOF {parseFloat(currentPackage.price).toLocaleString()}
                                    </span>
                                )}
                                <span className="text-4xl font-black text-white">
                                    XOF {parseFloat(currentPackage?.discount_price || currentPackage?.price || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">
                                    / {selectedDuration} {selectedDuration === 1 ? 'Day' : 'Days'}
                                </span>
                            </div>

                            <div className="h-px bg-[#222] w-full" />

                            <div className="grid grid-cols-1 gap-3">
                                {['Priority in search', 'Featured in category', 'Exclusive status badge'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs font-bold text-[#888]">
                                        <Check className={cn("w-4 h-4", selectedTier === 'featured' ? "text-blue-500" : "text-pink-500")} />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Duration Matrix (Grid) */}
                    <div className="grid grid-cols-3 gap-2">
                        {availableDurations.map((d) => {
                            const pkg = availablePackages.find(p => p.duration_days === d)
                            return (
                                <button
                                    key={d}
                                    onClick={() => setSelectedDuration(d)}
                                    className={cn(
                                        "py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                                        selectedDuration === d 
                                            ? (selectedTier === 'featured' ? "border-blue-500 bg-blue-500/10 text-white" : "border-pink-500 bg-pink-500/10 text-white")
                                            : "border-[#1a1a1a] bg-[#111] text-[#555] hover:border-[#333]"
                                    )}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {d} {d === 1 ? 'Day' : 'Days'}
                                    </span>
                                    <span className="text-xs font-black">
                                        {parseFloat(pkg?.discount_price || pkg?.price || 0).toLocaleString()}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Action Area */}
                    <div className="pt-2">
                        <Button 
                            onClick={handlePromote}
                            disabled={loading || !currentPackage}
                            className={cn(
                                "w-full h-16 rounded-full font-black text-md transition-all transform active:scale-95 shadow-2xl",
                                selectedTier === 'featured' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-pink-600 hover:bg-pink-700 shadow-pink-500/20"
                            )}
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2">UPGRADE AD <ChevronRight className="w-5 h-5" /></span>}
                        </Button>
                        <div className="mt-6 text-center">
                            <p className="text-[9px] font-black text-[#333] uppercase tracking-[0.3em]">SECURE PAYMENT VIA PAYSTACK</p>
                        </div>
                    </div>
                </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
