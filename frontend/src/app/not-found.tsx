'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6 py-12 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#0F172B]/5 rounded-full blur-[100px]" />

      <div className="max-w-3xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Visual Side */}
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="text-[180px] font-black text-[#0F172B]/5 leading-none select-none">
                404
              </div>
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-48 h-48 bg-white rounded-[40px] shadow-[0_20px_50px_rgba(255,79,24,0.15)] border border-primary/10 flex items-center justify-center transform rotate-12">
                   <div className="w-32 h-32 bg-primary/5 rounded-[30px] flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-primary" strokeWidth={1.5} />
                   </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">Lost in the Marketplace?</h2>
              <h1 className="text-4xl sm:text-5xl font-black text-[#0F172B] mb-6 leading-tight">
                This item has <br/>found a <span className="text-primary italic">new home.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
                We couldn't find the page you're looking for. It might have been sold, moved, or never existed in the first place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/" 
                  className="group inline-flex items-center justify-center px-8 py-4 bg-[#0F172B] text-white rounded-2xl font-bold transition-all hover:bg-[#1A253E] hover:shadow-xl hover:-translate-y-1 active:scale-95"
                >
                  <Home className="w-5 h-5 mr-3 transition-transform group-hover:rotate-6" />
                  Return Home
                </Link>
                
                <Link 
                  href="/search" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0F172B] border-2 border-slate-100 rounded-2xl font-bold transition-all hover:border-primary/20 hover:bg-slate-50 active:scale-95"
                >
                  <Search className="w-5 h-5 mr-3" />
                  Keep Browsing
                </Link>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 flex items-center justify-center lg:justify-start text-slate-400 text-sm"
              >
                <Link href="#" onClick={() => window.history.back()} className="flex items-center hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go back to previous page
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
