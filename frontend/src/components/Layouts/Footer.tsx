"use client"

import React from 'react'
import Link from 'next/link'
import Logo from '../General/Logo'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const { rootCategories, loading: categoriesLoading } = useCategories()

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Help & FAQ', href: '/help' },
    ],
    legal: [
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
    account: [
      { label: 'Login', href: '/login' },
      { label: 'Register', href: '/register' },
      { label: 'Post Ad', href: '/create-ad' },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ]

  return (
    <footer className={`bg-gray-900 text-gray-300 hidden md:block`}>
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Niger's trusted online marketplace. Buy, sell, and discover amazing deals every day.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a href="mailto:support@tajma.net" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@tajma.net</span>
              </a>
              <a href="tel:+22792649999" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+227 92 64 99 99</span>
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Niamey, Niger</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-white mb-4 mt-6">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            {categoriesLoading ? (
              <p className="text-sm text-gray-500">Loading categories...</p>
            ) : (
              <>
                <ul className="space-y-2 mb-3">
                  {rootCategories.slice(0, 5).map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
                <Link 
                  href="/categories" 
                  className="inline-flex items-center text-sm hover:text-white transition-colors border border-gray-700 hover:border-primary px-4 py-2 rounded"
                >
                  View All Categories
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
            
            <p className="text-sm text-gray-400 text-center sm:text-right">
              ©DIGIT SERVICES
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

