"use client"

import React from 'react'
import { CheckCircle } from 'lucide-react'

interface Step {
  num: number
  label: string
  desc: string
}

interface ProgressStepperProps {
  currentStep: number
  steps: Step[]
}

export default function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Steps Container with background line */}
      <div className="relative">
        {/* Background connecting line */}
        <div 
          className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" 
          style={{ marginLeft: '5%', marginRight: '5%' }}
        />
        
        {/* Active progress line */}
        <div 
          className="absolute top-5 sm:top-6 h-0.5 bg-secondary z-0 transition-all duration-500"
          style={{ 
            left: '5%',
            width: `${((currentStep - 1) / (steps.length - 1)) * 90}%`
          }}
        />
        
        {/* Steps */}
        <div className="relative flex items-start justify-between z-10">
          {steps.map((stepItem) => (
            <div key={stepItem.num} className="flex flex-col items-center" style={{ flex: '1 1 0%' }}>
              {/* Step Circle */}
              <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 bg-white ${
                currentStep >= stepItem.num 
                  ? 'border-secondary shadow-lg' 
                  : 'border-gray-300'
              }`}>
                {currentStep > stepItem.num ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                ) : currentStep === stepItem.num ? (
                  <span className="text-base sm:text-lg font-bold text-secondary">{stepItem.num}</span>
                ) : (
                  <span className="text-base sm:text-lg font-bold text-gray-400">{stepItem.num}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-3 text-center max-w-[100px] sm:max-w-none px-2">
                <p className={`text-xs sm:text-sm font-semibold transition-colors ${
                  currentStep >= stepItem.num ? 'text-secondary' : 'text-gray-600'
                }`}>
                  {stepItem.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                  {stepItem.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Progress Percentage */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Step {currentStep} of {steps.length}
        </span>
        <span className="text-secondary font-medium">
          {Math.round((currentStep / steps.length) * 100)}% Complete
        </span>
      </div>
    </div>
  )
}

