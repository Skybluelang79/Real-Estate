import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getNeighborhood } from '../data/neighborhoods';
import PropertyCard from '../components/PropertyCard';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import SafeImage from '../components/SafeImage';
import NewsletterSignup from '../components/NewsletterSignup';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageCtx';

export default function NeighborhoodDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const n = getNeighborhood(slug);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!n) { setLoading(false); return; }
    fetch(`${API_URL}/api/properties?city=${encodeURIComponent(n.name)}&limit=6`)
      .then(r => r.json())
      .then(data => { setProperties(data.properties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [n]);

  if (!n) {
    return (
      <section className="section properties-page" style={{ textAlign: 'center', paddingTop: '160px' }}>
        <h2>Neighborhood Not Found</h2>
        <Link to="/neighborhoods" className="btn-primary" style={{ marginTop: 20 }}>Back to Neighborhoods</Link>
      </section>
    );
  }

  return (
    <section className="section neighborhood-detail">
      <Seo
        title={`${n.name}, ${n.state} Neighborhood Guide`}
        description={`Explore ${n.name}: ${n.tagline}. Average home price ${n.stats.avgPrice}, walk score ${n.stats.walkScore}, schools ${n.stats.schools}.`}
        image={n.image}
        path={`/neighborhoods/${n.slug}`}
      />
      <div className="neighborhood-hero">
        <SafeImage src={n.image} alt={n.name} className="neighborhood-hero-image" />
        <div className="neighborhood-hero-overlay" />
        <div className="container neighborhood-hero-content">
          <Breadcrumbs current={n.name} />
          <h1>{n.name}, {n.state}</h1>
          <p>{n.tagline}</p>
        </div>
      </div>

      <div className="container">
        <div className="neighborhood-stats-row">
          <div className="neighborhood-stat"><span className="n-stat-value">{n.stats.avgPrice}</span><span className="n-stat-label">Avg. Home Price</span></div>
          <div className="neighborhood-stat"><span className="n-stat-value">{n.stats.walkScore}</span><span className="n-stat-label">Walk Score</span></div>
          <div className="neighborhood-stat"><span className="n-stat-value">{n.stats.transitScore}</span><span className="n-stat-label">Transit Score</span></div>
          <div className="neighborhood-stat"><span className="n-stat-value">{n.stats.schools}</span><span className="n-stat-label">School Rating</span></div>
        </div>

        <div className="neighborhood-body-grid">
          <div className="neighborhood-main">
            <div className="neighborhood-section">
              <h2>About {n.name}</h2>
              <p>{n.description}</p>
            </div>
            <div className="neighborhood-section">
              <h2>Highlights</h2>
              <div className="neighborhood-highlights">
                {n.highlights.map((h, i) => (
                  <div key={i} className="neighborhood-highlight">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {h}
                  </div>
                ))}
              </div>
            </div>
            <div className="neighborhood-section">
              <h2>Schools</h2>
              <ul className="neighborhood-list">
                {n.schools.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="neighborhood-section">
              <h2>Commute & Transit</h2>
              <p>{n.commute}</p>
              <div className="neighborhood-amenities">
                {n.amenities.map((a, i) => <span key={i} className="property-tag">{a}</span>)}
              </div>
            </div>
          </div>

          <aside className="neighborhood-sidebar">
            <div className="neighborhood-sidebar-card">
              <h3>Homes in {n.name}</h3>
              {loading ? <p>Loading listings...</p> : properties.length === 0 ? (
                <p className="admin-sub-text">No active listings right now — check back soon.</p>
              ) : (
                <div className="neighborhood-mini-list">
                  {properties.map((p) => (
                    <Link key={p.id} to={`/property/${p.id}`} className="neighborhood-mini">
                      <SafeImage src={p.image} alt={p.title || p.name} />
                      <div>
                        <strong>{p.title || p.name}</strong>
                        <span>${p.price ? parseInt(String(p.price).replace(/[$,]/g, '')).toLocaleString() : '—'}</span>
                        <span>{p.beds} bd · {p.baths} ba</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to={`/properties?search=${encodeURIComponent(n.name)}`} className="btn-ghost" style={{ marginTop: 12, width: '100%' }}>View all in {n.name}</Link>
            </div>
            <div className="neighborhood-sidebar-card">
              <h3>{t('newsletter.title')}</h3>
              <p className="admin-sub-text">{t('newsletter.desc')}</p>
              <NewsletterSignup compact />
            </div>
          </aside>
        </div>

        {properties.length > 0 && (
          <div className="neighborhood-section">
            <h2>Featured Homes in {n.name}</h2>
            <div className="property-grid">
              {properties.slice(0, 3).map((p) => <PropertyCard key={p.id || p._id} property={p} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
