"use client"

import React from 'react'
import { motion } from 'framer-motion'

export default function AuthLeftSection() {
  return (
    <div className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-1/2 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop)'
        }}
      />
      
      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Grid background - reduced opacity with animation */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0"
          animate={{
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content - positioned at bottom left */}
      <div className="relative z-10 flex flex-col justify-end items-start h-full px-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left max-w-lg"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl font-bold text-white mb-6"
          >
            Welcome to{' '}
            <span className="text-secondary">Tajma</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-300 mb-8"
          >
            Your marketplace for everything you need
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span className="text-gray-300">Buy and sell with confidence</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span className="text-gray-300">Connect with local sellers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span className="text-gray-300">Safe and secure transactions</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
