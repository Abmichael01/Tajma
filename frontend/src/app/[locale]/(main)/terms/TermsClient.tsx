"use client"

import React from 'react'
import { Link } from '@/i18n/routing'
import { FileText } from 'lucide-react'

export default function TermsClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Terms & Conditions
              </h1>
            </div>
            <p className="text-gray-600">Last updated: March 27, 2026</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="mx-auto prose prose-gray max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Welcome to Tajma Marketplace ("we," "our," or "us"). By accessing or using our website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Tajma Marketplace is an online platform that connects buyers and sellers. We provide the marketplace infrastructure, but we are not a party to any transactions between users.
            </p>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To use certain features of our platform, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              You must be at least 18 years old to create an account and use our services.
            </p>
          </section>

          {/* Posting Ads */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Posting Ads</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              When posting an ad on Tajma Marketplace, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Provide accurate and truthful descriptions of items or services</li>
              <li>Only post items you have the legal right to sell</li>
              <li>Set fair and reasonable prices</li>
              <li>Respond promptly to inquiries from potential buyers</li>
              <li>Complete transactions in good faith</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to remove any ad that violates these terms or our community guidelines.
            </p>
          </section>

          {/* Prohibited Items */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prohibited Items and Activities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may not post ads for or engage in the following:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Illegal items, services, or activities</li>
              <li>Counterfeit, stolen, or fraudulent goods</li>
              <li>Weapons, drugs, or controlled substances</li>
              <li>Adult content or services</li>
              <li>Pyramid schemes or multi-level marketing</li>
              <li>Items that infringe on intellectual property rights</li>
              <li>Misleading or deceptive content</li>
              <li>Spam or unsolicited advertising</li>
            </ul>
          </section>

          {/* Transactions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Transactions Between Users</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tajma Marketplace is a platform that facilitates connections between buyers and sellers. We are not involved in the actual transaction between users. All transactions are:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Conducted solely between buyers and sellers</li>
              <li>Subject to the terms agreed upon by both parties</li>
              <li>The responsibility of the parties involved</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              We recommend meeting in safe, public locations and using secure payment methods. Never share sensitive financial information through our messaging system.
            </p>
          </section>

          {/* Fees */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees and Payments</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Currently, basic ad posting and browsing on Tajma Marketplace is free. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Introduce premium features with associated fees</li>
              <li>Charge fees for certain categories or enhanced listings</li>
              <li>Modify our fee structure with reasonable notice</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All content on Tajma Marketplace, including logos, text, graphics, and software, is our property or our licensors' property and is protected by copyright and trademark laws.
            </p>
            <p className="text-gray-600 leading-relaxed">
              When you post content on our platform, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content on our platform.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To the maximum extent permitted by law, Tajma Marketplace shall not be liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or goodwill</li>
              <li>Disputes between users</li>
              <li>Quality, safety, or legality of items advertised</li>
              <li>Truth or accuracy of listings</li>
              <li>Ability of sellers to sell items or buyers to pay for items</li>
            </ul>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Account Termination</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account at any time if:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>You violate these Terms and Conditions</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>Your account has been inactive for an extended period</li>
              <li>We are required to do so by law</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              You may delete your account at any time through your account settings.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may modify these Terms and Conditions at any time. We will notify users of significant changes via email or through prominent notices on our platform. Your continued use of Tajma Marketplace after changes are made constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Niger. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Niger.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-gray-50 p-6 border border-gray-200">
              <p className="text-gray-600 mb-2">
                <strong>Email:</strong> legal@tajma.com
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Phone:</strong> +227 92 64 99 99
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> Niamey, Niger
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-center">
              By using Tajma Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. For more information, please read our{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

