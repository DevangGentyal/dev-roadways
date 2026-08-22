"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en } from "./locales/en";
import { hi } from "./locales/hi";
import { mr } from "./locales/mr";
import {
  Language,
  LanguageContextType,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
} from "./types";

const STORAGE_KEY = "dev_roadways_language";
const DEFAULT_LANGUAGE: Language = "hi";

const dictionaries: Record<Language, TranslationDictionary> = {
  hi,
  mr,
  en,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Helper to resolve nested key paths like "trip.createTrip" or "modals.createTrip.title"
function getNestedValue(
  obj: TranslationDictionary | undefined,
  path: string
): string | undefined {
  if (!obj) return undefined;
  const keys = path.split(".");
  let current: unknown = obj;

  for (const k of keys) {
    if (
      current &&
      typeof current === "object" &&
      k in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
}: {
  children: React.ReactNode;
  defaultLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (
        savedLang &&
        SUPPORTED_LANGUAGES.some((item) => item.code === savedLang)
      ) {
        setLanguageState(savedLang);
      } else {
        // Default to Hindi
        setLanguageState(DEFAULT_LANGUAGE);
        localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
      }
    } catch {
      // Fallback in environments without localStorage
    } finally {
      setIsReady(true);
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore localStorage write error
    }
  }, []);

  const t = useCallback(
    (
      key: string,
      params?: Record<string, string | number>,
      fallback?: string
    ): string => {
      const dict = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
      let value = getNestedValue(dict, key);

      // Fallback to Hindi if missing in current dictionary
      if (value === undefined && language !== "hi") {
        value = getNestedValue(dictionaries.hi, key);
      }
      // Fallback to English if still missing
      if (value === undefined && language !== "en") {
        value = getNestedValue(dictionaries.en, key);
      }

      if (value === undefined) {
        value = fallback !== undefined ? fallback : key;
      }

      if (params && Object.keys(params).length > 0) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
          const regex = new RegExp(`\\{${paramKey}\\}`, "g");
          return acc.replace(regex, String(paramValue));
        }, value);
      }

      return value;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isReady,
    }),
    [language, setLanguage, t, isReady]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return safe fallback if used outside provider during SSR/tests
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>, fallback?: string) => {
        const dict = dictionaries[DEFAULT_LANGUAGE];
        let val = getNestedValue(dict, key) || fallback || key;
        if (params) {
          for (const [pk, pv] of Object.entries(params)) {
            val = val.replace(new RegExp(`\\{${pk}\\}`, "g"), String(pv));
          }
        }
        return val;
      },
      isReady: true,
    };
  }
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage, isReady } = useLanguage();
  return { t, language, setLanguage, isReady };
}
