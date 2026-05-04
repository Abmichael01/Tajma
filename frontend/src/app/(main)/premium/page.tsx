"use client"

import React, { useEffect, useState } from 'react'
import { Zap, BarChart3, ShieldCheck, ChevronRight, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { paymentsApi } from '@/api/payments'

interface PromotionPackage {
  id: string;
  name: string;
  description?: string | null;
  promotion_type: 'boost' | 'featured';
  price: string;
  discount_price?: string | null;
  duration_days: number;
  is_active: boolean;
}

export default function PremiumPage() {
  const [packages, setPackages] = useState<PromotionPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await paymentsApi.getPromotionPackages()
        const plansList = Array.isArray(data) ? data : (data as any).results || []
        setPackages(plansList.filter((p: PromotionPackage) => p.is_active))
      } catch (err) {
        console.error('Failed to fetch premium plans:', err)
        setError('Could not load premium plans. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary selection:text-white">
      {/* Compact Hero Section */}
      <section className="relative py-16 container text-center overflow-hidden border-b border-slate-200/50">
        <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <Star className="w-3 h-3 text-primary" /> Premium Plans
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
                Boost Your <span className="text-primary italic">Visibility.</span>
            </h1>
            <p className="max-md mx-auto text-slate-400 font-medium text-sm md:text-base">
                Get your listings in front of thousands of buyers with our simple promotion plans.
            </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="container py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading plans...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl border border-red-100 bg-white text-center">
            <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full border-slate-200">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
            {packages.map((plan) => (
              <div key={plan.id} className="relative h-full bg-primary rounded-[40px] px-1 pb-1 pt-14 flex flex-col group transition-all hover:translate-y-[-4px]">
                  {/* Header Info (Sits in the top padding area) */}
                  <div className="absolute top-0 left-0 right-0 px-8 h-14 flex items-center justify-between text-white">
                      <Zap className="w-5 h-5 fill-current" />
                      <div className="text-[10px] font-black tracking-widest uppercase opacity-80">
                        {plan.duration_days} Days
                      </div>
                  </div>

                  {/* Inner Content Area */}
                  <div className="bg-white rounded-[36px] p-8 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight mb-2 uppercase text-slate-800">{plan.name}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                        {plan.description || "Get maximum exposure for your items with this premium package."}
                      </p>

                      <div className="flex items-baseline gap-1 mb-10">
                        <span className="text-4xl font-black text-slate-900">
                          {Number.parseFloat(plan.discount_price || plan.price).toLocaleString()}
                        </span>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest ml-1">XOF</span>
                      </div>
                    </div>

                    <Link href="/create-ad" className="block w-full">
                      <Button className="w-full h-14 rounded-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient text-white font-black text-sm tracking-widest transition-all active:scale-95 border-none shadow-xl shadow-primary/25">
                        SELECT PLAN <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
              </div>
            ))}
          </div>
        )}

        {!loading && packages.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 max-w-2xl mx-auto">
            <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No premium plans available.</p>
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white border-t border-slate-100">
         <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
               <BenefitIcon title="Instant" description="Applied immediately after payment." icon={Zap} />
               <BenefitIcon title="10x Reach" description="Top of search and category pages." icon={BarChart3} />
               <BenefitIcon title="Secure" description="Bank-grade Paystack encryption." icon={ShieldCheck} />
            </div>
         </div>
      </section>

      <style jsx global>{`
          @keyframes rotate-gradient {
            0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
            50% { background-position: 100% 50%; filter: hue-rotate(15deg); }
            100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
          }
          .animate-gradient {
            animation: rotate-gradient 8s ease-in-out infinite;
            background-size: 300% 300%;
          }
      `}</style>
    </div>
  )
}

function BenefitIcon({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
    return (
        <div className="space-y-4 px-6">
            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-black tracking-tight uppercase text-slate-800">{title}</h4>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">{description}</p>
        </div>
    )
}
