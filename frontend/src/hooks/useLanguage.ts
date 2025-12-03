import { useState, useEffect } from 'react'

export type LanguageCode = 'en' | 'fr' | 'ha'

interface Language {
  code: LanguageCode
  name: string
  nativeName: string
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
]

/**
 * Hook to get current language from Google Translate cookie
 */
export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en')

  useEffect(() => {
    const getLangFromCookie = (): LanguageCode => {
      if (typeof document === 'undefined') return 'en'
      
      const cookies = document.cookie.split(';')
      const googleTranslateCookie = cookies.find(c => c.trim().startsWith('googtrans='))
      
      if (googleTranslateCookie) {
        // Cookie format: googtrans=/en/fr or googtrans=/en/fr; path=/
        const cookieValue = googleTranslateCookie.split('=')[1]?.trim()
        if (cookieValue) {
          // Parse: /en/fr -> ['', 'en', 'fr']
          const parts = cookieValue.split('/')
          if (parts.length >= 3) {
            const lang = parts[2]?.split(';')[0]?.trim() // Remove any trailing semicolon and params
            // Map Google Translate language codes to our codes
            if (lang === 'fr') return 'fr'
            if (lang === 'ha') return 'ha'
            // Default to English if not French or Hausa
            return 'en'
          }
        }
      }
      return 'en'
    }

    // Set initial language
    const initialLang = getLangFromCookie()
    setCurrentLang(initialLang)

    // Listen for language changes (when cookie changes)
    const checkLanguage = () => {
      const newLang = getLangFromCookie()
      setCurrentLang(prevLang => {
        if (newLang !== prevLang) {
          return newLang
        }
        return prevLang
      })
    }

    // Check language periodically (in case it changes via Google Translate widget or language switcher)
    const interval = setInterval(checkLanguage, 1000)
    return () => clearInterval(interval)
  }, [])

  return currentLang
}

/**
 * Get translated default messages based on language
 */
export function getDefaultMessages(lang: LanguageCode = 'en'): string[] {
  const messages: Record<LanguageCode, string[]> = {
    en: [
      "Is this still available?",
      "What's the best price you can offer?",
      "Can I see more photos?",
      "Where are you located?",
      "When can I pick it up?",
    ],
    fr: [
      "Est-ce toujours disponible?",
      "Quel est le meilleur prix que vous pouvez offrir?",
      "Puis-je voir plus de photos?",
      "Où êtes-vous situé?",
      "Quand puis-je le récupérer?",
    ],
    ha: [
      "Shin har yanzu yana nan?",
      "Menene mafi kyawun farashin da zaku iya bayarwa?",
      "Zan iya ganin ƙarin hotuna?",
      "Ina kuke?",
      "Yaushe zan iya karɓa?",
    ],
  }

  return messages[lang] || messages.en
}

