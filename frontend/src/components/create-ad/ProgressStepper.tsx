"use client"

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  num: number
  label: string
  desc: string
}

interface ProgressStepperProps {
  currentStep: number
  steps: Step[]
  showMeta?: boolean
}

export default function ProgressStepper({ currentStep, steps, showMeta = false }: ProgressStepperProps) {
  return (
    <div className="mb-8">
      {/* Steps Container */}
      <div className="relative flex items-center justify-between">
        {/* Continuous Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-1/2 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full"
          style={{ 
            left: 0,
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />
        
        {/* Steps */}
        {steps.map((stepItem, idx) => {
          const isCompleted = currentStep > stepItem.num
          const isActive = currentStep === stepItem.num
          
          return (
            <div key={stepItem.num} className="relative z-10 flex flex-col items-center">
              {/* Step Marker */}
              <div className={cn(
                "w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                isCompleted ? "bg-primary border-primary" : 
                isActive ? "bg-white border-primary scale-110 shadow-md" : 
                "bg-white border-gray-200"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isActive ? "bg-primary" : "bg-gray-300"
                  )} />
                )}
              </div>
              
              {/* Conditional Label (only for active or completed on larger screens) */}
              <span className={cn(
                "absolute -bottom-6 text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap transition-all duration-300",
                isActive ? "text-primary opacity-100 -translate-y-0.5" : "text-gray-400 opacity-0 sm:opacity-70"
              )}>
                {stepItem.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

