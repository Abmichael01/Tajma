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
 * Hook to get current language
 * Adapted for Mobile: Uses state defaulting to 'en'.
 * TODO: Integrate with AsyncStorage or expo-localization for persistence.
 */
export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en')

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
