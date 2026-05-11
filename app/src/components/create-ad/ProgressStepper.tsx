import React from 'react';
import { View } from 'react-native';
import AppText from '../ui/AppText';
import { cn } from '@/utils/cn';

interface Step {
  num: number;
  label: string;
  desc: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps: Step[];
  showMeta?: boolean;
}

export default function ProgressStepper({ currentStep, steps, showMeta = false }: ProgressStepperProps) {
  return (
    <View className="mb-8">
      {/* Pill Container */}
      <View className="flex-row items-center bg-slate-50 p-1.5 rounded-full border border-slate-100">
        {steps.map((stepItem, index) => {
          const isActive = currentStep === stepItem.num;
          const isCompleted = currentStep > stepItem.num;
          
          return (
            <View 
              key={stepItem.num} 
              className={cn(
                "flex-1 h-11 flex-row items-center justify-center rounded-full transition-all duration-300",
                isActive ? "bg-white shadow-sm" : ""
              )}
            >
              {/* Step Number / Icon */}
              <View className={cn(
                "w-6 h-6 rounded-full items-center justify-center mr-2",
                isActive ? "bg-primary" : (isCompleted ? "bg-primary/20" : "bg-slate-200")
              )}>
                <AppText 
                  weight="bold" 
                  className={cn(
                    "text-[10px]",
                    isActive ? "text-white" : (isCompleted ? "text-primary" : "text-slate-500")
                  )}
                >
                  {stepItem.num}
                </AppText>
              </View>

              <AppText 
                weight={isActive ? "bold" : "medium"} 
                className={cn(
                  "text-[11px] uppercase tracking-wider",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
                numberOfLines={1}
              >
                {stepItem.label}
              </AppText>
            </View>
          );
        })}
      </View>

      {showMeta && (
        <View className="mt-4 flex-row justify-between items-center px-2">
          <AppText className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
            Progress
          </AppText>
          <View className="flex-row items-center">
            <View className="w-32 h-1.5 bg-slate-100 rounded-full mr-3 overflow-hidden">
                <View 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
            </View>
            <AppText className="text-[11px] text-primary font-black">
                {Math.round((currentStep / steps.length) * 100)}%
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

