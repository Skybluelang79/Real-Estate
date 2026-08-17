import { createContext, useContext } from 'react';

const LanguageContext = createContext(null);

export default LanguageContext;

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { lang: 'en', setLang: () => {}, t: (key) => key };
  }
  return ctx;
}
