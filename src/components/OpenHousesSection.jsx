import { Link } from 'react-router';
import { usePropertiesQuery } from '../api/properties';
import SafeImage from './SafeImage';
import { useLanguage } from '../context/LanguageContext';

function formatPrice(price) {
  const num = parseInt(String(price).replace(/[$,]/g, ''), 10);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${(num || 0).toLocaleString()}`;
}

export default function OpenHousesSection() {
  const { t } = useLanguage();
  const { data, isLoading } = usePropertiesQuery({ limit: 6 });
  const properties = data?.properties || [];

  if (!isLoading && properties.length === 0) return null;

  const day = new Date().getDay();
  const weekendSat = new Date();
  weekendSat.setDate(weekendSat.getDate() + ((6 - day + 7) % 7));
  const dateLabel = weekendSat.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <section className="section open-houses-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('home.openHouses.title')}</h2>
          <p>{t('home.openHouses.subtitle')}</p>
        </div>
        <div className="open-houses-grid">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="open-house-card skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-lg" />
                    <div className="skeleton-line skeleton-sm" />
                  </div>
                </div>
              ))
            : properties.slice(0, 3).map((p) => (
                <Link to={`/property/${p.id || p._id}`} key={p.id || p._id} className="open-house-card">
                  <div className="open-house-img">
                    <SafeImage src={p.image} alt={p.title || p.name} />
                    <span className="open-house-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                      Sat {dateLabel}
                    </span>
                  </div>
                  <div className="open-house-body">
                    <h3>{p.title || p.name}</h3>
                    <p className="open-house-location">{p.city}, {p.state}</p>
                    <p className="open-house-meta">10:00 AM – 1:00 PM · {formatPrice(p.price)}</p>
                    <span className="btn-ghost btn-sm open-house-cta">View Listing →</span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
