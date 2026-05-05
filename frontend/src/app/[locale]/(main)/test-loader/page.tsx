'use client'

import React from 'react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function TestLoaderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Marketplace Loader Test</h1>
          
          <div className="space-y-12">
            {/* Standalone Loaders with Messages */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Standalone Loaders (with messages)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Small</h3>
                  <MarketplaceLoader size="sm" message="Loading..." />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Medium</h3>
                  <MarketplaceLoader size="md" message="Please wait..." />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Large</h3>
                  <MarketplaceLoader size="lg" message="Wait while we set up your account..." />
                </div>
              </div>
            </section>

            {/* Standalone Loaders without Messages */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Standalone Loaders (no messages)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Small</h3>
                  <MarketplaceLoader size="sm" />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Medium</h3>
                  <MarketplaceLoader size="md" />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Large</h3>
                  <MarketplaceLoader size="lg" />
                </div>
              </div>
            </section>

            {/* Color Variations */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Color Variations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Primary (Default)</h3>
                  <MarketplaceLoader size="md" message="Primary" />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Blue</h3>
                  <MarketplaceLoader size="md" color="bg-blue-500" message="Blue" />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Green</h3>
                  <MarketplaceLoader size="md" color="bg-green-500" message="Green" />
                </div>
                <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Red</h3>
                  <MarketplaceLoader size="md" color="bg-red-500" message="Red" />
                </div>
              </div>
            </section>

            {/* White Variant */}
            <section>
              <h2 className="text-xl font-semibold mb-4">White Variant (for colored backgrounds)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-primary border border-gray-200">
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-medium mb-4 text-white">Small White</h3>
                  <MarketplaceLoader size="sm" white message="Loading..." />
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-medium mb-4 text-white">Medium White</h3>
                  <MarketplaceLoader size="md" white message="Loading..." />
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-medium mb-4 text-white">Large White</h3>
                  <MarketplaceLoader size="lg" white message="Loading..." />
                </div>
              </div>
            </section>

            {/* Inline Loaders (for buttons) */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Inline Loaders (for buttons)</h2>
              <div className="space-y-4">
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Default (Primary Color)</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <button className="px-4 py-2 bg-primary text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" />
                      <span>Loading...</span>
                    </button>
                    <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" />
                      <span>Processing...</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">White (for colored buttons)</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <button className="px-4 py-2 bg-primary text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" white />
                      <span>Loading...</span>
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" white />
                      <span>Processing...</span>
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" white />
                      <span>Saving...</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Custom Colors</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" color="bg-blue-500" />
                      <span>Loading...</span>
                    </button>
                    <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" color="bg-green-500" />
                      <span>Processing...</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Real-world Examples */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Real-world Examples</h2>
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Google Auth Callback</h3>
                  <div className="flex items-center justify-center py-12">
                    <MarketplaceLoader size="lg" message="Wait while we set up your account..." />
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Page Loading</h3>
                  <div className="flex items-center justify-center py-12">
                    <MarketplaceLoader size="md" message="Loading page..." />
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-medium mb-4 text-gray-700">Button Loading States</h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-2 bg-primary text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" white />
                      <span>Signing in...</span>
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" white />
                      <span>Creating account...</span>
                    </button>
                    <button className="px-6 py-2 border-2 border-gray-300 text-gray-700 flex items-center gap-2" disabled>
                      <MarketplaceLoader inline size="sm" />
                      <span>Sending...</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

