import { useState, useEffect, useRef, useContext, memo, lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthCtx';
import { CompareContext } from '../context/CompareContext';
import { useLanguage } from '../context/LanguageCtx';
const Lightbox = lazy(() => import('./Lightbox'));
import SafeImage from './SafeImage';
import API_URL from '../config';
import { viewersFor } from '../utils/socialProof';

function PropertyCard({ property }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const { addToCompare, removeFromCompare, isInCompare } = useContext(CompareContext);
  const [isFavorited, setIsFavorited] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/favorites/${propId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsFavorited(data.favorited);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const formatPrice = (price) => {
    const num = parseInt(String(price).replace(/[$,]/g, ''));
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${(num || 0).toLocaleString()}`;
  };

  const propName = property.name || property.title || '';
  const propSize = property.size || property.sqft || '—';
  const tags = property.tags ? (Array.isArray(property.tags) ? property.tags : property.tags.split(',').filter(Boolean)) : [];
  const propId = property.id || property._id;
  const viewers = viewersFor(propId);
  const isFeatured = property.featured === 1 || property.featured === true;

  return (
    <>
      <div
        ref={cardRef}
        className={`property-card card-hover ${isVisible ? 'property-card-visible' : ''}`}
      >
        <div className="property-card-inner">
          <div className="property-card-image-wrap">
            <SafeImage src={property.image} alt={propName} className="property-card-image" />
            {property.badge && (
              <span className={`property-badge badge-${property.badge.toLowerCase().replace(/\s+/g, '-')}`}>
                {property.badge}
              </span>
            )}
            {property.isPrivate === 1 && (
              <span className="property-badge badge-private">Private</span>
            )}
            <button className={`favorite-btn ${isFavorited ? 'favorited' : ''}`} onClick={toggleFavorite} aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button className="lightbox-trigger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxOpen(true); }} aria-label="View larger image" title="View larger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            </button>
            {property.video && (
              <Link to={`/property/${propId}`} className="video-indicator" aria-label="Virtual Tour Available" title="Virtual Tour Available">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </Link>
            )}
            <span className="card-watching">
              <span className="card-watching-dot" />
              {viewers} people viewing
            </span>
          </div>
          <div className="property-card-body">
            <div className="property-price">
              {formatPrice(property.price)}
              {isFeatured && (
                <span className="verified-badge" title="Verified listing">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </span>
              )}
            </div>
            <h3 className="property-name">{propName}</h3>
            <div className="property-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {property.city}, {property.state}
            </div>
            <div className="property-stats">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V7l9-5 9 5v15"/><path d="M9 22V12h6v10"/></svg> {property.beds} {t('card.beds')}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v7"/></svg> {property.baths} {t('card.baths')}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> {typeof propSize === 'number' ? propSize.toLocaleString() : propSize} {t('card.sqft')}</span>
            </div>
            {tags.length > 0 && (
              <div className="property-tags">
                {tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="property-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <Link to={`/property/${propId}`} className="btn-primary property-view-btn">
              {t('card.view')}
            </Link>
            <button
              className={`btn-ghost btn-sm`}
              style={{ width: '100%', marginTop: 4, fontSize: '0.8rem' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isInCompare(propId)) {
                  removeFromCompare(propId);
                } else {
                  addToCompare({ ...property, id: propId });
                }
              }}
            >
              {isInCompare(propId) ? t('card.removeCompare') : t('card.addCompare')}
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Lightbox
          isOpen={lightboxOpen}
          images={property.images && property.images.length > 0 ? property.images : [property.image]}
          imageAlt={propName}
          onClose={() => setLightboxOpen(false)}
        />
      </Suspense>
    </>
  );
}

export default memo(PropertyCard);