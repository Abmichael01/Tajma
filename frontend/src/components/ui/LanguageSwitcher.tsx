"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Language {
  code: string
  name: string
  nativeName: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
]

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    // Get current language from Google Translate cookie
    const getLangFromCookie = () => {
      const cookies = document.cookie.split(';')
      const googleTranslateCookie = cookies.find(c => c.trim().startsWith('googtrans='))
      if (googleTranslateCookie) {
        const lang = googleTranslateCookie.split('/')[2]
        return lang || 'en'
      }
      return 'en'
    }

    setCurrentLang(getLangFromCookie())
  }, [])

  const changeLanguage = (langCode: string) => {
    // Set Google Translate cookie
    const domain = window.location.hostname
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`
    document.cookie = `googtrans=/en/${langCode}; path=/`
    
    setCurrentLang(langCode)
    
    // Reload to apply translation
    window.location.reload()
  }

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLang) || languages[0]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer ${currentLang === lang.code ? 'bg-secondary/10 text-secondary font-semibold' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>{lang.nativeName}</span>
              {currentLang === lang.code && (
                <span className="text-secondary text-xs">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
