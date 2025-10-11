"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, Target, Shield, TrendingUp, Heart, Award } from 'lucide-react'

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              About Tajma Marketplace
            </h1>
            <p className="text-lg sm:text-xl text-white/90">
              Nigeria's fastest-growing online marketplace, connecting buyers and sellers across the nation. Buy, sell, and discover amazing deals every day.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
            <p>
              Founded in 2024, Tajma Marketplace was born from a simple idea: to make buying and selling easier, safer, and more accessible for everyone in Nigeria.
            </p>
            <p>
              We recognized that people needed a trusted platform where they could discover great deals, connect with genuine sellers, and build meaningful transactions with confidence. Today, thousands of Nigerians use Tajma Marketplace daily to buy and sell everything from electronics and vehicles to real estate and services.
            </p>
            <p>
              Our mission is to empower individuals and businesses by providing a seamless, secure, and user-friendly marketplace that brings communities together.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Trust */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust & Safety</h3>
              <p className="text-gray-600">
                Building a secure platform where every transaction is protected and every user is verified.
              </p>
            </div>

            {/* Community */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community First</h3>
              <p className="text-gray-600">
                Creating a vibrant community where buyers and sellers connect, share, and grow together.
              </p>
            </div>

            {/* Innovation */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Constantly improving our platform with cutting-edge features to enhance your experience.
              </p>
            </div>

            {/* Excellence */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">
                Committed to delivering world-class service and support to every user, every time.
              </p>
            </div>

            {/* Accessibility */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600">
                Making online marketplace accessible to everyone, regardless of location or technical expertise.
              </p>
            </div>

            {/* Integrity */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrity</h3>
              <p className="text-gray-600">
                Operating with transparency, honesty, and ethical practices in everything we do.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Tajma by Numbers
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-secondary mb-2">100K+</div>
              <div className="text-gray-600">Ads Posted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">25K+</div>
              <div className="text-gray-600">Successful Deals</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-secondary mb-2">36</div>
              <div className="text-gray-600">States Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Join Thousands of Happy Users
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start buying, selling, and discovering amazing deals on Tajma Marketplace today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/create-ad">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Post Your First Ad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

