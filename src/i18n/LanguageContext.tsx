import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLanguage, LanguageOption, SUPPORTED_LANGUAGES, TranslationDictionary } from './types';
import { en } from './locales/en';
import { kn } from './locales/kn';
import { hi } from './locales/hi';
import { ta } from './locales/ta';

const LOCALE_MAP: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  kn,
  hi,
  ta,
};

import { LanguageContext, LanguageContextType } from './context';
export type { LanguageContextType };

const STORAGE_KEY = 'accesspath_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
      if (saved && LOCALE_MAP[saved]) {
        return saved;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 'en';
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore localStorage write errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dictionary = useMemo(() => LOCALE_MAP[language] || en, [language]);

  // Dot notation lookup: e.g. "common.appName" or "a11yToolbar.highContrast"
  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.');
    let current: any = dictionary;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    // Fallback to English if translation is missing
    let fallbackVal: any = en;
    for (const part of parts) {
      if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
        fallbackVal = fallbackVal[part];
      } else {
        fallbackVal = undefined;
        break;
      }
    }

    if (typeof fallbackVal === 'string') {
      return fallbackVal;
    }

    return fallback ?? path;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
        dictionary,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export { useLanguage } from './useLanguage';
