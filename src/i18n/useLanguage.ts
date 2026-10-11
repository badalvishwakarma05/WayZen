import { useContext } from 'react';
import { LanguageContext, LanguageContextType } from './context';
import { SUPPORTED_LANGUAGES } from './types';
import { en } from './locales/en';

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback to English for isolated tests or components
    return {
      language: 'en',
      setLanguage: () => {},
      languages: SUPPORTED_LANGUAGES,
      t: (path: string, fallback?: string) => {
        const parts = path.split('.');
        let current: any = en;
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return fallback ?? path;
          }
        }
        return typeof current === 'string' ? current : (fallback ?? path);
      },
      dictionary: en,
    };
  }
  return context;
};
