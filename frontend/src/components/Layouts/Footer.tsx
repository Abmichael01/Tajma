"use client"

import React from 'react'
import { Link } from '@/i18n/routing'
import Logo from '../General/Logo'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useTranslations } from 'next-intl'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const t = useTranslations('footer')
  const commonT = useTranslations('common')
  const currentYear = new Date().getFullYear()
  const { rootCategories, loading: categoriesLoading } = useCategories()

  const footerLinks = {
    company: [
      { label: t('about_us'), href: '/about' },
      { label: t('contact'), href: '/contact' },
      { label: t('help_faq'), href: '/help' },
    ],
    legal: [
      { label: t('terms_conditions'), href: '/terms' },
      { label: t('privacy'), href: '/privacy' },
    ],
    account: [
      { label: commonT('login'), href: '/login' },
      { label: commonT('register'), href: '/register' },
      { label: commonT('post_ad'), href: '/create-ad' },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ]

  return (
    <footer className={`bg-secondary text-secondary-foreground hidden md:block`}>
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-sm text-secondary-foreground/80 mb-6">
              {t('brand_desc')}
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
            <h3 className="font-semibold text-white mb-4">{t('company')}</h3>
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
            <h3 className="font-semibold text-white mb-4">{t('account')}</h3>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-white mb-4 mt-6">{t('legal')}</h3>
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
            <h3 className="font-semibold text-white mb-4">{t('categories')}</h3>
            {categoriesLoading ? (
              <p className="text-sm text-secondary-foreground/70">{commonT('loading')}</p>
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
                  className="inline-flex items-center text-sm hover:text-white transition-colors border border-white/20 hover:border-white px-4 py-2 rounded-xl"
                >
                  {t('view_all_categories')}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-8 border-t border-white/10">
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
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
            
            <p className="text-sm text-secondary-foreground/70 text-center sm:text-right">
              ©DIGIT SERVICES
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

