import { Link } from 'react-router';
import { usePropertiesQuery } from '../api/properties';
import PropertyCard from './PropertyCard';
import { useLanguage } from '../context/LanguageContext';

export default function JustListed() {
  const { t } = useLanguage();
  const { data, isLoading, isError } = usePropertiesQuery({ limit: 8, sort: 'newest' });
  const properties = data?.properties || [];

  if (!isLoading && (isError || properties.length === 0)) return null;

  return (
    <section className="section just-listed-section">
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <h2>{t('home.justListed.title')}</h2>
            <p>{t('home.justListed.subtitle')}</p>
          </div>
          <div className="section-header-actions">
            <Link to="/properties" className="btn-ghost btn-sm">{t('home.justListed.viewAll')}</Link>
          </div>
        </div>
        {isLoading ? (
          <div className="property-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="property-card skeleton-card">
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line skeleton-lg" />
                  <div className="skeleton-line skeleton-sm" />
                  <div className="skeleton-line skeleton-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="property-grid">
            {properties.slice(0, 8).map((p) => (
              <PropertyCard
                key={p.id || p._id}
                property={p.badge ? p : { ...p, badge: t('home.justListed.new') }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
