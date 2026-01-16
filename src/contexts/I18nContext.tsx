import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { t: i18nT, i18n } = useTranslation();
  
  // Initialize state from localStorage or i18n.language or default
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('language');
    // If we have a saved language, use it. Otherwise use what i18n thinks or 'zh'
    return saved || i18n.language || 'zh';
  });

  // Effect to sync i18n instance and attach listener
  useEffect(() => {
    const saved = localStorage.getItem('language');
    
    // 1. If we have a saved language that differs from current i18n, sync it
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    } else if (!saved && i18n.language && i18n.language !== currentLang) {
      // If no saved language but i18n has one, update our state to match i18n
      setCurrentLang(i18n.language);
    } else if (!saved && !i18n.language) {
      // If neither has anything, force i18n to our default
      i18n.changeLanguage(currentLang);
    }

    // 2. Attach listener for future changes
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng);
      localStorage.setItem('language', lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    // The listener above will update the state and localStorage
  };

  return (
    <I18nContext.Provider value={{ language: currentLang, setLanguage, t: i18nT }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be within I18nProvider');
  return ctx;
}
