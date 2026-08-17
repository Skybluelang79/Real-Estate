import { Link } from 'react-router';
import SafeImage from './SafeImage';
import { useLanguage } from '../context/LanguageCtx';
import neighborhoods from '../data/neighborhoods';

export default function NeighborhoodsPreview() {
  const { t } = useLanguage();
  const featured = neighborhoods.slice(0, 3);

  return (
    <section className="section neighborhoods-preview-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('neighborhoods.title')}</h2>
          <p>{t('neighborhoods.subtitle')}</p>
        </div>
        <div className="neighborhoods-preview-grid">
          {featured.map((n) => (
            <Link to={`/neighborhoods/${n.slug}`} key={n.slug} className="neighborhood-preview-card">
              <div className="neighborhood-preview-img">
                <SafeImage src={n.image} alt={n.name} />
                <div className="neighborhood-preview-overlay" />
                <div className="neighborhood-preview-info">
                  <h3>{n.name}</h3>
                  <p>{n.tagline}</p>
                  <span className="neighborhood-preview-price">
                    {t('neighborhoods.avgPrice')}: {n.stats.avgPrice}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="neighborhoods-preview-footer">
          <Link to="/neighborhoods" className="btn-ghost">
            {t('neighborhoods.viewAll')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
