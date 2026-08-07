import { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

export const LanguageContext = createContext(null);

const LANG_KEY = 'dreamhomes-lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, fallback) => {
    const dict = translations[lang] || translations.en;
    const parts = String(key).split('.');
    let val = dict;
    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = val[part];
      } else {
        return fallback !== undefined ? fallback : key;
      }
    }
    return typeof val === 'string' || Array.isArray(val) ? val : (fallback !== undefined ? fallback : key);
  };

  const value = { lang, setLang, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { lang: 'en', setLang: () => {}, t: (key) => key };
  }
  return ctx;
}
