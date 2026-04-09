'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Mail, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry or other reporting services
    console.error('Tajma Runtime Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#FF4F18]/5 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-slate-900/5 rounded-full blur-[120px]" />

      <div className="max-w-xl w-full mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] border border-white/40 border-t-white/80"
        >
          {/* Visual Icon */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-red-50 rounded-[30px] flex items-center justify-center shadow-inner"
              >
                <ShieldAlert className="w-12 h-12 text-red-500" strokeWidth={1.5} />
              </motion.div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-red-50 flex items-center justify-center">
                 <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-[#0F172B] mb-4">Something took a detour.</h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
              We've hit an unexpected snag while processing your request. Don't worry, our engineers have been alerted!
            </p>

            <div className="flex flex-col gap-4">
              <Button 
                onClick={reset}
                className="w-full h-16 bg-[#0F172B] hover:bg-[#1A253E] text-white rounded-2xl font-bold flex items-center justify-center transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
              >
                <RefreshCw className="w-5 h-5 mr-3" />
                Retry Process
              </Button>
              
              <div className="flex flex-row gap-3">
                <Link href="/" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full h-16 border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 hover:border-[#0F172B]/10 transition-all active:scale-95 text-[#0F172B]"
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Go Home
                  </Button>
                </Link>
                
                <Link href="mailto:support@tajma.net" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full h-16 border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 text-[#0F172B]"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Help Desk
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Debug Info (Dev Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 pt-8 border-t border-slate-100"
            >
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">Development Logs</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 overflow-auto max-h-48 text-left">
                <p className="text-xs font-mono text-red-600 font-bold mb-1">{error.name}: {error.message}</p>
                <pre className="text-[10px] font-mono text-slate-500 opacity-70 whitespace-pre-wrap leading-relaxed">
                  {error.stack}
                </pre>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        <p className="text-center mt-8 text-slate-400 text-sm italic">
          Tajma — Premium Marketplace Operations
        </p>
      </div>
    </div>
  )
}
