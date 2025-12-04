"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Search, HelpCircle, MessageSquare } from 'lucide-react'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I create an account on Tajma Marketplace?',
    answer: 'Creating an account is easy! Click the "Sign Up" button in the top right corner, fill in your details (name, email, phone, location), and verify your email address. You can also sign up using your Google or Facebook account.'
  },
  {
    id: 2,
    category: 'Getting Started',
    question: 'Is it free to use Tajma Marketplace?',
    answer: 'Yes! Creating an account and posting basic ads is completely free. We may introduce premium features in the future, but our core marketplace will always remain free for buyers and sellers.'
  },
  {
    id: 3,
    category: 'Posting Ads',
    question: 'How do I post an ad?',
    answer: 'After logging in, click "Post Ad" or the "+" button. Choose your category, fill in the details, upload photos, set your price, and publish. Your ad will be live immediately and visible to thousands of potential buyers.'
  },
  {
    id: 4,
    category: 'Posting Ads',
    question: 'How many photos can I upload?',
    answer: 'You can upload up to 8 photos per ad. We recommend using clear, high-quality images from different angles to help buyers make informed decisions. Good photos significantly increase your chances of a quick sale!'
  },
  {
    id: 5,
    category: 'Posting Ads',
    question: 'Can I edit my ad after posting?',
    answer: 'Yes! Go to your profile, navigate to "My Ads," find the ad you want to edit, and click "Edit." You can update the title, description, price, photos, and other details at any time.'
  },
  {
    id: 6,
    category: 'Buying',
    question: 'How do I contact a seller?',
    answer: 'Click on any ad you are interested in, then click the "Contact Seller" button. You can send a message through our chat system or call the seller directly if they have shared their phone number.'
  },
  {
    id: 7,
    category: 'Buying',
    question: 'Is it safe to buy on Tajma Marketplace?',
    answer: 'While we verify users and moderate content, always exercise caution. Meet in public places, inspect items before paying, never pay in advance without proper protection, and trust your instincts. Report any suspicious activity immediately.'
  },
  {
    id: 8,
    category: 'Buying',
    question: 'Can I negotiate the price?',
    answer: 'Yes! Many sellers are open to negotiation. Use our messaging system to discuss the price professionally. Be respectful and make reasonable offers based on the item condition and market value.'
  },
  {
    id: 9,
    category: 'Selling',
    question: 'How quickly will my ad appear?',
    answer: 'Your ad goes live immediately after posting! It will appear in search results and category listings right away, making it visible to potential buyers across Niger.'
  },
  {
    id: 10,
    category: 'Selling',
    question: 'What items cannot be sold on Tajma?',
    answer: 'We prohibit illegal items, weapons, drugs, counterfeit goods, adult content, and anything that violates Niger law. Check our Terms & Conditions for the complete list of prohibited items.'
  },
  {
    id: 11,
    category: 'Selling',
    question: 'How do I mark an item as sold?',
    answer: 'Go to "My Ads" in your profile, find the sold item, click the menu button (three dots), and select "Mark as Sold." This will update the status and notify anyone who saved your ad.'
  },
  {
    id: 12,
    category: 'Account',
    question: 'I forgot my password. What should I do?',
    answer: 'Click "Forgot Password" on the login page, enter your email address, and we will send you a reset link. Follow the instructions in the email to create a new password.'
  },
  {
    id: 13,
    category: 'Account',
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone. All your ads, messages, and data will be permanently deleted.'
  },
  {
    id: 14,
    category: 'Safety',
    question: 'What are some safety tips for meeting buyers/sellers?',
    answer: 'Always meet in public places, bring a friend if possible, let someone know where you are going, inspect items carefully before payment, use secure payment methods, and trust your instincts. Never share sensitive personal information.'
  },
  {
    id: 15,
    category: 'Safety',
    question: 'How do I report a suspicious ad or user?',
    answer: 'Click the "Report" button on any ad or user profile. Select the reason for reporting and provide details. Our moderation team will review and take appropriate action within 24 hours.'
  },
]

export default function HelpClient() {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: number) => {
    setActiveId(activeId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              How Can We Help You?
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Find answers to frequently asked questions about using Tajma Marketplace
            </p>
            
            {/* Search Box */}
            <div className="relative max-w-2xl mx-auto">
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white text-gray-900"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto py-4 custom-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or browse all categories
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-xs font-medium text-primary mb-1 block">
                        {faq.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                        activeId === faq.id ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {activeId === faq.id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-600 mb-8">
              Cannot find what you are looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  Contact Support
                </Button>
              </Link>
              <a href="mailto:support@tajma.com">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

