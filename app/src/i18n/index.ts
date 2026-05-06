import i18n, { LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ha from './locales/ha.json';

const STORAGE_KEY = '@tajma_language';

const resources: Record<string, any> = {
  en: { translation: en },
  fr: { translation: fr },
  ha: { translation: ha },
};

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string | readonly string[] | undefined) => void | undefined) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return savedLanguage;
      }
      
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      const lang = resources[deviceLanguage] ? deviceLanguage : 'en';
      callback(lang);
      return lang;
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('en');
      return 'en';
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
