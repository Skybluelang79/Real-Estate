import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import SafeImage from './SafeImage';
import { useLanguage } from '../context/LanguageContext';

function formatPrice(price) {
  const num = parseInt(String(price).replace(/[$,]/g, ''), 10);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${(num || 0).toLocaleString()}`;
}

export default function RecentlyViewed() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setItems(Array.isArray(viewed) ? viewed.slice(0, 6) : []);
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="recently-viewed-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('home.recentlyViewed')}</h2>
          <p>{t('home.recentlyViewedSub')}</p>
        </div>
        <div className="recently-viewed-grid">
          {items.map((p) => (
            <Link key={p.id} to={`/property/${p.id}`} className="recently-viewed-card">
              <div className="recently-viewed-img">
                <SafeImage src={p.image} alt={p.title} />
              </div>
              <div className="recently-viewed-body">
                <h3>{p.title}</h3>
                <span className="recently-viewed-price">{formatPrice(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
