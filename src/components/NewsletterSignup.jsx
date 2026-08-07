import { useState } from 'react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function NewsletterSignup({ compact = false }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

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

  return (
    <form className={`newsletter-form ${compact ? 'newsletter-form-compact' : ''}`} onSubmit={submit}>
      <input
        type="email"
        placeholder={compact ? t('footer.newsletterPlaceholder') : t('newsletter.placeholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email"
      />
      <button type="submit" className="btn-primary">
        {compact ? t('footer.subscribe') : t('newsletter.subscribe')}
      </button>
      {status === 'ok' && <p className="newsletter-status newsletter-status-ok">{compact ? t('footer.subscribed') : t('newsletter.subscribed')}</p>}
      {status === 'error' && <p className="newsletter-status newsletter-status-error">{compact ? t('footer.subscribeError') : t('newsletter.error')}</p>}
    </form>
  );
}
