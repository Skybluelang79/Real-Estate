import { useState, useEffect } from 'react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

const DISMISS_KEY = 'dreamhomes_newsletter_dismissed';

export default function NewsletterPopup() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let done = false;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(DISMISS_KEY) === '1') return;
      } catch { /* ignore */ }
      if (!done) setVisible(true);
    }, 9000);
    return () => { done = true; clearTimeout(timer); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('ok');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!visible) return null;

  return (
    <div className="newsletter-popup-overlay" onClick={dismiss}>
      <div className="newsletter-popup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={dismiss} aria-label="Close">×</button>
        <h3>{t('newsletter.popupTitle')}</h3>
        <p>{t('newsletter.popupDesc')}</p>
        <form className="newsletter-form" onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            required
          />
          <button type="submit" className="btn-primary">{t('newsletter.subscribe')}</button>
          {status === 'ok' && <p className="newsletter-status newsletter-status-ok">{t('newsletter.subscribed')}</p>}
          {status === 'error' && <p className="newsletter-status newsletter-status-error">{t('newsletter.error')}</p>}
        </form>
        <button className="newsletter-popup-no" onClick={dismiss}>{t('newsletter.popupDismiss')}</button>
      </div>
    </div>
  );
}
