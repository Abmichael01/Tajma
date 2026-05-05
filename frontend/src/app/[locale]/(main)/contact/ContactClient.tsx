"use client"
import { Link } from '@/i18n/routing'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Send, CheckCircle } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useCreateReport } from '@/hooks/useReports'
import { useAuthStore } from '@/store/authStore'

export default function ContactClient() {
  const { user, isAuthenticated } = useAuthStore()
  const createReport = useCreateReport()
  
  const [formData, setFormData] = useState({
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!isAuthenticated) {
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = 'Please enter your full name'
      }

      if (!formData.email) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email'
      }
    }

    if (!formData.subject || formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters'
    }

    if (!formData.message || formData.message.length < 20) {
      newErrors.message = 'Message must be at least 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const contactEmail = isAuthenticated ? user?.email : formData.email
      await createReport.mutateAsync({
        report_type: 'support',
        reason: 'other',
        description: `[Subject: ${formData.subject}]\n\n${formData.message}`,
        contact_email: contactEmail || ''
      })
      setIsSuccess(true)
      setFormData(prev => ({ ...prev, subject: '', message: '' }))
      // Reset success after 10 seconds
      setTimeout(() => setIsSuccess(false), 10000)
    } catch (error) {
      // toast handled in hook
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden border-b border-gray-100">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.4]" 
             style={{ backgroundImage: `linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
        </div>

        {/* Blurred Aura Circles */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] z-0 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] z-0"></div>
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-[80px] z-0"></div>

        <div className="container py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-medium italic text-gray-900 mb-4 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 font-medium italic">
              Your inquiry will create a support ticket and our team will get back to you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="container -mt-10 pb-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          {isSuccess && (
            <div className="mb-8 bg-green-50 border border-green-200 p-6 flex items-start gap-3 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Ticket Created Successfully!</h3>
                <p className="text-sm text-green-700">
                  Thank you for reaching out. A support ticket has been opened and we'll get back to you shortly.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-[32px]">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Send us a Message</h2>
            <p className="text-gray-600 mb-8 text-center">
              Fill out the form below and we'll respond as quickly as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`h-12 rounded-full border-gray-200 focus:ring-primary focus:border-primary transition-all ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`h-12 rounded-full border-gray-200 focus:ring-primary focus:border-primary transition-all ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`h-12 rounded-full border-gray-200 focus:ring-primary focus:border-primary transition-all ${errors.subject ? 'border-red-500' : ''}`}
                  placeholder="How can we help you?"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-[24px] ${
                    errors.message ? 'border-red-500' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="Tell us more about your inquiry..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.message.length} / 500 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full font-bold transition-all"
                size="lg"
                disabled={createReport.isPending}
              >
                {createReport.isPending ? (
                  <>
                    <MarketplaceLoader inline size="sm" white />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ Callout */}
      <div className="bg-gray-50 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need Quick Answers?
            </h2>
            <p className="text-gray-600 mb-6 font-medium">
              Check out our FAQ section for instant answers to common questions.
            </p>
            <Link href="/help">
              <Button variant="outline" size="lg" className="rounded-full h-12 px-8 font-bold border-gray-300">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
