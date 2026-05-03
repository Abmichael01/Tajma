"use client"

import React from 'react'
import { Sparkles, TrendingUp, Check, Zap, BarChart3, ShieldCheck, ChevronRight, Rocket, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function PremiumPage() {
  const plans = [
    {
      type: 'boost',
      slug: 'ultra',
      name: 'ULTRA 2.0',
      tag: 'MOST POPULAR',
      description: 'Ideal for everyday items needing a push.',
      icon: TrendingUp,
      accent: 'pink',
      discount: '40% OFF',
      features: ['Higher search rank', 'Category featured section', 'Active blue status badge', 'Recent ads priority'],
      tiers: [
        { duration: '1 Day', price: '250 XOF', oldPrice: '400 XOF' },
        { duration: '1 Week', price: '1,000 XOF', oldPrice: '1,500 XOF', popular: true },
        { duration: '1 Month', price: '3,500 XOF', oldPrice: '5,000 XOF' },
      ]
    },
    {
      type: 'featured',
      slug: 'elite',
      name: 'ELITE 3.0',
      tag: 'BEST VALUE',
      description: 'Maximum dominance for premium listings.',
      icon: Sparkles,
      accent: 'blue',
      discount: '60% OFF',
      features: ['Top of results placement', 'Homepage hero section', 'Premium gold elite badge', 'Priority buyer notifications', 'Advanced listing analytics'],
      tiers: [
        { duration: '1 Day', price: '1,500 XOF', oldPrice: '2,500 XOF' },
        { duration: '1 Week', price: '5,000 XOF', oldPrice: '8,000 XOF', popular: true },
        { duration: '1 Month', price: '15,000 XOF', oldPrice: '25,000 XOF' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary selection:text-white">
      {/* SaaS Hero Section */}
      <section className="relative py-32 container text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111] border border-[#222] text-[10px] font-black tracking-widest text-[#555] uppercase">
                <Zap className="w-3 h-3 text-primary" /> Multi-duration optimization enabled
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                Power your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-shine italic">Presence.</span>
            </h1>
            <p className="max-w-xl mx-auto text-[#666] font-bold text-lg md:text-xl">
                Unlock advanced placement algorithms and dominate your category with Tajma Premium tiers.
            </p>
        </div>
      </section>

      {/* Seedance Grid Layout */}
      <section className="container pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.type} className="relative group">
                {/* Glowing Sharp Border Wrapper */}
                <div className={cn(
                    "absolute -inset-[3px] rounded-[44px] transition-opacity duration-1000",
                    plan.accent === 'blue' ? "bg-blue-600 shadow-[0_0_40px_-5px_rgba(37,99,235,0.4)]" : "bg-pink-600 shadow-[0_0_40px_-5px_rgba(219,39,119,0.4)]"
                )} />
                
                <div className="relative h-full bg-[#0A0A0A] rounded-[40px] overflow-hidden flex flex-col">
                    {/* Top Tag */}
                    <div className={cn(
                        "h-12 flex items-center justify-center text-[10px] font-black tracking-[0.3em] text-white",
                        plan.accent === 'blue' ? "bg-blue-600" : "bg-pink-600"
                    )}>
                        ✦ {plan.tag}
                    </div>

                    <div className="p-10 flex-1 flex flex-col justify-between space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-5xl font-black tracking-tighter">{plan.name}</h2>
                                <div className={cn("px-3 py-1 rounded-lg text-white font-black text-xs italic", plan.accent === 'blue' ? "bg-blue-500" : "bg-pink-500")}>
                                    {plan.discount}
                                </div>
                            </div>
                            <p className="text-[#666] font-bold text-sm mb-12">{plan.description}</p>

                            <div className="space-y-4 mb-16">
                                {plan.tiers.map((t) => (
                                    <div key={t.duration} className={cn(
                                        "flex items-center justify-between p-6 rounded-3xl border-2 transition-all",
                                        t.popular ? "border-[#333] bg-[#111]" : "border-transparent bg-[#0D0D0D]"
                                    )}>
                                        <div>
                                            <span className="text-[10px] font-black text-[#444] uppercase tracking-widest">{t.duration}</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-xl font-black text-white">{t.price}</span>
                                                <span className="text-xs font-bold text-[#333] line-through">{t.oldPrice}</span>
                                            </div>
                                        </div>
                                        {t.popular && <div className="text-[9px] font-black text-primary italic underline underline-offset-4 tracking-[0.2em]">MOST POPULAR</div>}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] mb-6">CORE FEATURES</div>
                                {plan.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-4 text-white font-bold text-sm">
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", plan.accent === 'blue' ? "bg-blue-500/10 text-blue-500" : "bg-pink-500/10 text-pink-500")}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Link href="/create-ad">
                            <Button size="lg" className={cn(
                                "w-full h-16 rounded-full font-black text-lg transition-transform active:scale-95 shadow-2xl",
                                plan.accent === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-pink-600 hover:bg-pink-700 shadow-pink-500/20"
                            )}>
                                INITIALIZE {plan.slug.toUpperCase()} <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* SaaS Trust Section */}
      <section className="py-24 border-t border-[#111] bg-[#050505]">
         <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 px-10">
               <BenefitIcon title="Engineered for Speed" description="Ads activate with zero latency the second payment hits the distributed ledger." icon={Zap} />
               <BenefitIcon title="Algorithmic Edge" description="Our rank index rewards Premium listings with 10x more targeted search surface area." icon={BarChart3} />
               <BenefitIcon title="Verified Security" description="Fully encrypted Paystack integration ensures every upgrade is 100% secure." icon={ShieldCheck} />
            </div>
         </div>
      </section>

      <style jsx global>{`
          @keyframes shine {
            from { filter: brightness(1); }
            50% { filter: brightness(1.5); color: #fff; }
            to { filter: brightness(1); }
          }
          .animate-shine {
            animation: shine 4s ease-in-out infinite;
          }
      `}</style>
    </div>
  )
}

function BenefitIcon({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
    return (
        <div className="space-y-4">
            <div className="w-12 h-12 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center text-primary group hover:bg-primary hover:text-white transition-all duration-300">
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black tracking-tight">{title}</h4>
            <p className="text-[#555] font-bold text-sm leading-relaxed">{description}</p>
        </div>
    )
}
