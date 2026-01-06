import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

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
    <View className="mb-6">
      {/* Steps Container */}
      <View className="relative">
        {/* Background connecting line */}
        <View 
          className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 z-0"
          style={{ marginLeft: '10%', marginRight: '10%' }}
        />
        
        {/* Active progress line */}
        <View 
          className="absolute top-5 h-0.5 bg-primary z-0"
          style={{ 
            left: '10%',
            width: `${((currentStep - 1) / (steps.length - 1)) * 80}%`
          }}
        />
        
        {/* Steps */}
        <View className="relative flex-row items-start justify-between z-10">
          {steps.map((stepItem) => (
            <View key={stepItem.num} className="flex-1 items-center">
              {/* Step Circle */}
              <View className={`flex items-center justify-center w-10 h-10 border-2 bg-white rounded-lg ${
                currentStep >= stepItem.num 
                  ? 'border-primary shadow-md' 
                  : 'border-gray-300'
              }`}>
                {currentStep > stepItem.num ? (
                  <Ionicons name="checkmark" size={20} color="#cb234a" />
                ) : currentStep === stepItem.num ? (
                  <AppText weight="bold" className="text-primary text-base">
                    {stepItem.num}
                  </AppText>
                ) : (
                  <AppText weight="bold" className="text-gray-400 text-base">
                    {stepItem.num}
                  </AppText>
                )}
              </View>
              
              {/* Step Label */}
              <View className="mt-2 items-center max-w-[100px]">
                <AppText 
                  className={`text-xs text-center ${
                    currentStep >= stepItem.num ? 'text-primary font-semibold' : 'text-gray-600'
                  }`}
                >
                  {stepItem.label}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {showMeta && (
        <View className="mt-4 flex-row justify-between">
          <AppText className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </AppText>
          <AppText className="text-sm text-primary font-medium">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </AppText>
        </View>
      )}
    </View>
  );
}
