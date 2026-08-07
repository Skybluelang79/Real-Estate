import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import translations from '../i18n/translations';

function Consumer() {
  const { t, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="navHome">{t('nav.home')}</span>
      <span data-testid="missing">{t('does.not.exist')}</span>
      <span data-testid="fallback">{t('does.not.exist', 'FB')}</span>
      <span data-testid="nested">{t('footer.rights')}</span>
      <button onClick={() => setLang('zh')}>switch</button>
    </div>
  );
}

function flatten(obj, prefix = '', out = {}) {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => flatten(item, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object') {
      flatten(val, path, out);
    } else {
      out[path] = val;
    }
  }
  return out;
}

describe('LanguageContext', () => {
  it('resolves nested keys in English by default', () => {
    render(<LanguageProvider><Consumer /></LanguageProvider>);
    expect(screen.getByTestId('navHome').textContent).toBe('Home');
    expect(screen.getByTestId('nested').textContent).toBe('Dream Homes Real Estate. All rights reserved.');
  });

  it('returns the key for missing translations', () => {
    render(<LanguageProvider><Consumer /></LanguageProvider>);
    expect(screen.getByTestId('missing').textContent).toBe('does.not.exist');
  });

  it('returns fallback when provided for missing keys', () => {
    render(<LanguageProvider><Consumer /></LanguageProvider>);
    expect(screen.getByTestId('fallback').textContent).toBe('FB');
  });

  it('switches language and updates document lang', () => {
    render(<LanguageProvider><Consumer /></LanguageProvider>);
    act(() => screen.getByText('switch').click());
    expect(screen.getByTestId('navHome').textContent).toBe('首页');
    expect(document.documentElement.lang).toBe('zh');
  });

  it('all locales structurally match the English key tree', () => {
    const enKeys = flatten(translations.en);
    for (const lang of ['zh', 'es']) {
      const keys = flatten(translations[lang]);
      for (const key of Object.keys(enKeys)) {
        expect(keys, `${lang} is missing key: ${key}`).toHaveProperty(key);
      }
    }
  });

  it('every leaf value in each locale is a non-empty string', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      for (const [path, val] of Object.entries(flatten(dict))) {
        expect(typeof val, `${lang}.${path} should be a string`).toBe('string');
        expect(val.trim().length, `${lang}.${path} should not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
