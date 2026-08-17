import { useEffect, useState } from 'react';
import LanguageContext from './LanguageCtx';
import translations from '../i18n/translations';

const LANG_KEY = 'dreamhomes-lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'es' || stored === 'zh' ? stored : 'en';
  });

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
