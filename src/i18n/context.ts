import { createContext } from 'react';
import { SupportedLanguage, LanguageOption, TranslationDictionary } from './types';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languages: LanguageOption[];
  t: (path: string, fallback?: string) => string;
  dictionary: TranslationDictionary;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
