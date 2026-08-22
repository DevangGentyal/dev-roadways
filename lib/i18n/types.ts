export type Language = 'hi' | 'mr' | 'en';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'en', label: 'English', nativeName: 'English' },
];

export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
  isReady: boolean;
}
