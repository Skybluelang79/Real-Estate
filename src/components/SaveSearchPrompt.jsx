import { useState } from 'react';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const HIDE_KEY = 'dreamhomes_save_search_hidden';

export default function SaveSearchPrompt() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState('');
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; }
  });

  if (!user || hidden) return null;

  const save = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saved-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: t('home.saveSearch.searchName'), filters: {}, alertEnabled: 1 }),
      });
      if (res.ok) {
        setStatus('ok');
        setTimeout(() => setHidden(true), 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="save-search-prompt">
      <div className="container">
        <div className="save-search-prompt-inner">
          <div>
            <strong>{t('home.saveSearch.title')}</strong>
            <p>{t('home.saveSearch.desc')}</p>
          </div>
          <div className="save-search-prompt-actions">
            {status === 'ok' && <span className="save-search-ok">{t('home.saveSearch.saved')}</span>}
            <button className="btn-primary btn-sm" onClick={save} disabled={status === 'ok'}>
              {t('home.saveSearch.button')}
            </button>
            <button className="btn-ghost btn-sm" onClick={hide}>{t('home.saveSearch.dismiss')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
