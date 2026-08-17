import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthCtx';
import PropertyCard from '../components/PropertyCard';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageCtx';

export default function PrivateCollection() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/api/properties/vip`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProperties(data.properties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <section className="section properties-page private-page">
      <Seo
        title="The Private Collection"
        description="Off-market and by-appointment luxury residences reserved exclusively for Dream Homes members."
        path="/private"
      />
      <div className="container">
        <Breadcrumbs current={t('private.title')} />
        <div className="page-header private-header">
          <div className="private-header-badge">Members Only</div>
          <h1>{t('private.title')}</h1>
          <p>{t('private.subtitle')}</p>
        </div>

        {!token ? (
          <div className="private-lock">
            <div className="private-lock-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2>{t('private.signInTitle')}</h2>
            <p>{t('private.signInDesc')}</p>
            <div className="private-lock-actions">
              <Link to="/signin" className="btn-primary">{t('private.signInCta')}</Link>
              <Link to="/signup" className="btn-ghost">{t('private.signUp')}</Link>
            </div>
          </div>
        ) : loading ? (
          <div className="property-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="property-card skeleton-card"><div className="skeleton-img" /><div className="skeleton-body"><div className="skeleton-line skeleton-lg" /><div className="skeleton-line skeleton-sm" /></div></div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <p>{t('private.empty')}</p>
            <Link to="/properties" className="btn-primary" style={{ marginTop: 16 }}>{t('home.browseProperties')}</Link>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map((p) => <PropertyCard key={p.id || p._id} property={{ ...p, badge: p.badge || 'Private' }} />)}
          </div>
        )}
      </div>
    </section>
  );
}
