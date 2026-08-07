import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';

export default function CtaBanner() {
  const { t } = useLanguage();
  return (
    <section className="cta-section">
      <div className="cta-overlay" />
      <div className="container">
        <div className="cta-inner">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.desc')}</p>
          <div className="cta-actions">
            <Link to="/contact" className="btn-primary">
              {t('cta.button')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/properties" className="btn-ghost cta-secondary">
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
