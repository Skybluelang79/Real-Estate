import { useState, useEffect, useRef, useCallback, useContext, useMemo, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../context/AuthCtx';
import { CompareContext } from '../context/CompareContext';
const MortgageCalculator = lazy(() => import('../components/MortgageCalculator'));
const Lightbox = lazy(() => import('../components/Lightbox'));
import Breadcrumbs from '../components/Breadcrumbs';
import SafeImage from '../components/SafeImage';
const NeighborhoodInsights = lazy(() => import('../components/NeighborhoodInsights'));
const PDFFlyer = lazy(() => import('../components/PDFFlyer'));
import Advertisements from '../components/Advertisements';
import Seo from '../components/Seo';
const AgentRating = lazy(() => import('../components/AgentRating'));
import API_URL from '../config';
import usePageTitle from '../hooks/usePageTitle';
import { usePropertyQuery, usePropertiesQuery } from '../api/properties';
import { neighborhoodForCity } from '../data/neighborhoods';
import { viewersFor } from '../utils/socialProof';

function getYoutubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  return url;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare } = useContext(CompareContext);
  const [mainImage, setMainImage] = useState('');
  const [mainIdx, setMainIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', message: '' });
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState('');
  const [offerForm, setOfferForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', amount: '', message: '' });
  const [offerStatus, setOfferStatus] = useState('');
  const [tourForm, setTourForm] = useState({ name: '', email: '', phone: '', date: '', time: '10:00 AM', notes: '' });
  const tourFormRef = useRef(tourForm);
  tourFormRef.current = tourForm;
  const [tourStatus, setTourStatus] = useState('');
  const [tourProperty, setTourProperty] = useState('');
  const [openHouses, setOpenHouses] = useState([]);
  const [ohForm, setOhForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', guests: 1 });
  const [ohStatus, setOhStatus] = useState('');
  const videoRef = useRef(null);
  const galleryTimerRef = useRef(null);

  const [priceHistory, setPriceHistory] = useState([]);
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [priceAlertStatus, setPriceAlertStatus] = useState('');
  const [priceAlertSent, setPriceAlertSent] = useState(false);

  const { data: propertyData, isLoading } = usePropertyQuery(id);
  const property = propertyData?.property || null;

  usePageTitle(property ? property.name || property.title : 'Property');
  const [favorited, setFavorited] = useState(false);
  const [favoritedMsg, setFavoritedMsg] = useState('');

  useEffect(() => {
    if (!property) return;
    let cancelled = false;
    fetch(`${API_URL}/api/properties/${property.id}/history`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setPriceHistory(d.history || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [property]);

  const { data: allProps } = usePropertiesQuery({ limit: 100 });
  const similar = useMemo(() => {
    const list = allProps?.properties || [];
    if (!property) return [];
    const others = list.filter((p) => String(p.id || p._id) !== String(id));
    const scored = others.map((p) => {
      let score = 0;
      if (p.city && property.city && String(p.city).toLowerCase() === String(property.city).toLowerCase()) score += 2;
      if (p.type && property.type && String(p.type).toLowerCase() === String(property.type).toLowerCase()) score += 1;
      return { p, score };
    });
    const matched = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.p);
    const chosen = matched.length >= 1 ? matched : others;
    return chosen.slice(0, 3);
  }, [allProps, property, id]);

  useEffect(() => {
    if (!property) return;
    setMainImage(property?.image || '');
    setMainIdx(0);
    setTourProperty(property?.name || property?.title || '');
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updated = [{ id: property.id, title: property.name || property.title, image: property.image, price: property.price }, ...viewed.filter(v => String(v.id) !== String(property.id))].slice(0, 6);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  }, [property]);

  useEffect(() => {
    if (!token || !property) return;
    fetch(`${API_URL}/api/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setFavorited((d.favorites || []).some(f => String(f.propertyId) === String(property.id))))
      .catch(() => {});
  }, [token, property]);

  const toggleFavorite = async () => {
    if (!token) {
      setFavoritedMsg('Sign in to save this property.');
      setTimeout(() => setFavoritedMsg(''), 3000);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/favorites/${property.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setFavorited(d.favorited);
    } catch {}
  };

  useEffect(() => {
    fetch(`${API_URL}/api/open-houses`)
      .then(r => r.json())
      .then(d => setOpenHouses((d.openHouses || []).filter(o => String(o.propertyId) === String(id))))
      .catch(() => {});
  }, [id]);

  const submitOhRsvp = async (oh) => {
    if (!ohForm.name.trim() || !ohForm.email.trim()) { setOhStatus('Please enter your name and email.'); return; }
    try {
      const res = await fetch(`${API_URL}/api/open-houses/${oh.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ohForm),
      });
      const d = await res.json();
      if (res.ok) {
        setOhStatus('You are confirmed! See you at the open house.');
        setOhForm({ ...ohForm, phone: '', guests: 1 });
      } else {
        setOhStatus(d.error || 'Could not RSVP. Please try again.');
      }
    } catch { setOhStatus('Could not RSVP. Please try again.'); }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/analytics/view`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: id, page: `/property/${id}` }) }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (tourOpen || offerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [tourOpen, offerOpen]);

  const galleryImages = useMemo(() => {
    const imgs = property?.images && property.images.length > 0 ? property.images : (property?.image ? [property.image] : []);
    const fps = property?.floorPlans && property.floorPlans.length > 0
      ? property.floorPlans
      : (property?.floorPlan ? [property.floorPlan] : []);
    return [...imgs, ...fps];
  }, [property?.images, property?.floorPlans, property?.image, property?.floorPlan]);
  const images = galleryImages.filter((img) => !img.includes('floorPlan') && !img.includes('floor-plan'));
  const hasFloorPlans = galleryImages.length > images.length;
  const amenities = property?.amenities && Array.isArray(property.amenities) ? property.amenities : [];

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    galleryTimerRef.current = setInterval(() => {
      setMainIdx(prev => (prev + 1) % galleryImages.length);
    }, 4000);
    return () => { if (galleryTimerRef.current) clearInterval(galleryTimerRef.current); };
  }, [galleryImages.length]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setMainImage(galleryImages[mainIdx]);
    }
  }, [mainIdx, galleryImages]);

  const openLightbox = useCallback((idx) => {
    setMainIdx(idx);
    setMainImage(galleryImages[idx]);
    setLightboxOpen(true);
  }, [galleryImages]);

  const sendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.email.trim() || !inquiryMsg.trim()) {
      setInquiryStatus('Please provide your name, email and a message.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inquiryForm.name, email: inquiryForm.email, phone: inquiryForm.phone, message: inquiryMsg, propertyId: parseInt(id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send inquiry');
      setInquiryStatus('Inquiry sent successfully! An agent will contact you.');
      setInquiryMsg('');
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setInquiryStatus(''), 4000);
    } catch (err) {
      setInquiryStatus(err.message || 'Failed to send inquiry.');
    }
  };

  const scheduleTour = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/tours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tourForm.name,
          email: tourForm.email,
          phone: tourForm.phone,
          propertyId: parseInt(id),
          preferredDate: tourForm.date,
          preferredTime: tourForm.time,
          message: tourForm.notes,
        }),
      });
      setTourStatus('Tour scheduled successfully!');
      setTourForm({ name: '', email: '', phone: '', date: '', time: '10:00 AM', notes: '' });
      setTimeout(() => { setTourStatus(''); setTourOpen(false); }, 2000);
    } catch {
      setTourStatus('Failed to schedule tour.');
    }
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setOfferStatus('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/properties/${id}/offers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: offerForm.name,
          email: offerForm.email,
          phone: offerForm.phone,
          amount: parseFloat(offerForm.amount),
          message: offerForm.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer');
      setOfferStatus('Offer submitted successfully! An agent will contact you shortly.');
      setOfferForm({ name: user?.name || '', email: user?.email || '', phone: '', amount: '', message: '' });
      setTimeout(() => { setOfferStatus(''); setOfferOpen(false); }, 3000);
    } catch (err) {
      setOfferStatus(err.message || 'Failed to submit offer.');
    }
  };

  const displayName = property?.name || property?.title || 'Property';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${displayName} on Dream Homes`;
  const neighborhood = neighborhoodForCity(property?.city);

  const submitPriceAlert = async (e) => {
    e.preventDefault();
    if (!priceAlertEmail.trim()) { setPriceAlertStatus('Please enter your email.'); return; }
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: priceAlertEmail.trim(),
          email: priceAlertEmail.trim(),
          type: 'buyer',
          source: 'price-alert',
          notes: `Price drop alert for ${displayName}`,
        }),
      });
      if (res.ok) {
        setPriceAlertSent(true);
        setPriceAlertStatus('You are subscribed. We will email you if the price changes.');
      } else {
        setPriceAlertStatus('Could not subscribe. Please try again.');
      }
    } catch {
      setPriceAlertStatus('Could not subscribe. Please try again.');
    }
  };

  const shareSocial = (platform) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    };
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied!'));
    } else {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <section className="section properties-page">
        <div className="container">
          <div className="skeleton-detail"><div className="skeleton-line skeleton-lg" /><div className="skeleton-line skeleton-md" /><div className="skeleton-line skeleton-sm" /></div>
        </div>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="section properties-page" style={{ textAlign: 'center', paddingTop: '200px' }}>
        <h2>Property Not Found</h2>
        <Link to="/properties" className="btn-primary" style={{ marginTop: '20px' }}>Browse Properties</Link>
      </section>
    );
  }

  const tags = property.tags ? (Array.isArray(property.tags) ? property.tags : property.tags.split(',').filter(Boolean)) : [];
  const hasVideo = property.video && property.video.trim();
  const videoEmbedUrl = hasVideo ? getYoutubeEmbedUrl(property.video) : '';
  const priceDisplay = property.price ? `$${parseInt(String(property.price).replace(/[$,]/g, '')).toLocaleString()}` : '';
  const agentObj = property.agent || {};
  const agentName = typeof agentObj === 'string' ? agentObj : agentObj.name || '';
  const agentPhone = agentObj.phone || '';
  const agentEmail = agentObj.email || '';
  const displaySize = property.size || property.sqft || '—';

  const scrollToVideo = () => {
    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="section properties-page">
      <Seo
        title={displayName}
        description={`${displayName} in ${property.city}, ${property.state} — ${priceDisplay || ''} | ${property.beds} beds, ${property.baths} baths, ${displaySize.toLocaleString()} sqft. View details and schedule a tour at Dream Homes.`}
        image={property.image}
        path={`/property/${id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: displayName,
          url: shareUrl,
          description: property.description,
          image: property.image,
          numberOfRooms: property.beds,
          numberOfBathroomsTotal: property.baths,
          floorSize: property.sqft ? { '@type': 'QuantitativeValue', value: property.sqft, unitCode: 'FTK' } : undefined,
          offers: { '@type': 'Offer', price: property.price, priceCurrency: 'USD', availability: property.status === 'For Sale' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.address,
            addressLocality: property.city,
            addressRegion: property.state,
            postalCode: property.zipcode || property.zip,
            addressCountry: property.country || 'US',
          },
          geo: property.latitude && property.longitude
            ? { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude }
            : undefined,
        }}
      />
      <div className="container">
        <Breadcrumbs current={displayName} />
        <div className="detail-layout">
          <div className="detail-gallery">
            <button className="detail-main-image-wrap" onClick={() => openLightbox(mainIdx)} aria-label="View gallery">
              <SafeImage src={mainImage} alt={displayName} className="detail-main-image" />
              <div className="detail-gallery-overlay">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                <span>View Gallery</span>
              </div>
            </button>
            <div className="detail-thumbs">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  className={`detail-thumb ${mainIdx === i ? 'detail-thumb-active' : ''} ${i >= images.length && hasFloorPlans ? 'detail-thumb-floorplan' : ''}`}
                  onClick={() => { setMainIdx(i); setMainImage(img); if (galleryTimerRef.current) { clearInterval(galleryTimerRef.current); } }}
                  aria-label={`View image ${i + 1} of ${galleryImages.length}`}
                >
                  <SafeImage src={img} alt={`${displayName} ${i + 1}`} />
                  {i >= images.length && hasFloorPlans && <span className="floorplan-label">Floor Plan</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="detail-price-row">
              <div className="detail-price-tag">{priceDisplay}</div>
              {property.status && property.status !== 'For Sale' && (
                <span className={`detail-status-badge detail-status-${String(property.status).toLowerCase().replace(/\s+/g, '-')}`}>{property.status}</span>
              )}
              {property.availability && (
                <span className="detail-availability-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                  {property.availability}
                </span>
              )}
              {property.type === 'Retail' && (
                <span className="detail-availability-badge detail-retail-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9l8-5 8 5v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z"/><path d="M9 20v-6h6v6"/></svg>
                  Retail {property.retail ? `· ${property.retail}` : ''}
                </span>
              )}
              <button className={`detail-fav-btn ${favorited ? 'detail-fav-btn-active' : ''}`} onClick={toggleFavorite} aria-label="Save to favorites" title={favorited ? 'Remove from favorites' : 'Save to favorites'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              </button>
              {favoritedMsg && <span className="detail-fav-msg">{favoritedMsg}</span>}
            </div>
            <div className="detail-social-proof">
              <span className="detail-watching">
                <span className="detail-watching-dot" />
                {viewersFor(id)} people viewing this home right now
              </span>
              {property.featured === 1 && (
                <span className="detail-verified">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Verified Listing
                </span>
              )}
            </div>
            <h1 className="detail-title">{displayName}</h1>
            <div className="detail-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {[property.address, property.city, property.state, property.zipcode, property.country].filter(Boolean).join(', ')}
            </div>
            {neighborhood && (
              <Link to={`/neighborhoods/${neighborhood.slug}`} className="neighborhood-link">
                Explore the {neighborhood.name} Neighborhood Guide →
              </Link>
            )}

            <div className="detail-stats-row">
              <div className="detail-stat"><span className="detail-stat-num">{property.beds}</span><span className="detail-stat-label">Beds</span></div>
              <div className="detail-stat"><span className="detail-stat-num">{property.baths}</span><span className="detail-stat-label">Baths</span></div>
              <div className="detail-stat"><span className="detail-stat-num">{displaySize.toLocaleString()}</span><span className="detail-stat-label">Sq Ft</span></div>
              {property.yearBuilt && <div className="detail-stat"><span className="detail-stat-num">{property.yearBuilt}</span><span className="detail-stat-label">Year</span></div>}
              {property.price && (property.sqft || property.size) && (
                <div className="detail-stat"><span className="detail-stat-num">${Math.round(Number(property.price) / Number(property.sqft || property.size)).toLocaleString()}</span><span className="detail-stat-label">Per Sq Ft</span></div>
              )}
            </div>

            {property.badge && <span className={`property-badge badge-${property.badge.toLowerCase().replace(/\s+/g, '-')}`} style={{ alignSelf: 'flex-start' }}>{property.badge}</span>}

            {property.latitude && property.longitude && (
              <div className="detail-map-embed">
                <iframe
                  title="Location"
                  src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            <div className="detail-section">
              <h3>About this property</h3>
              <p>{property.description}</p>
            </div>

            {tags.length > 0 && (
              <div className="detail-section">
                <h3>Features</h3>
                <div className="property-tags">{tags.map((t, i) => <span key={i} className="property-tag">{t.trim()}</span>)}</div>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="detail-section">
                <h3>Amenities</h3>
                <div className="detail-amenities">
                  {amenities.map((a, i) => (
                    <span key={i} className="detail-amenity">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasFloorPlans && (
              <div className="detail-section">
                <h3>Floor Plans</h3>
                <div className="detail-floorplans">
                  {floorPlanList.map((fp, i) => (
                    <button
                      key={i}
                      className="detail-floorplan-card"
                      onClick={() => {
                        const idx = images.length + i;
                        setMainIdx(idx);
                        setMainImage(galleryImages[idx]);
                        if (galleryTimerRef.current) clearInterval(galleryTimerRef.current);
                      }}
                    >
                      <SafeImage src={fp} alt={`Floor plan ${i + 1}`} />
                      <span>Floor Plan {floorPlanList.length > 1 ? i + 1 : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-property-details">
              <h3>Property Details</h3>
              <div className="detail-details-grid">
                {property.lotSize && <div className="detail-detail-item"><span className="dd-label">Lot Size</span><span className="dd-value">{property.lotSize} acres</span></div>}
                {property.hoa && <div className="detail-detail-item"><span className="dd-label">HOA</span><span className="dd-value">${Number(property.hoa).toLocaleString()}/mo</span></div>}
                {property.propertyTaxes && <div className="detail-detail-item"><span className="dd-label">Property Taxes</span><span className="dd-value">${Number(property.propertyTaxes).toLocaleString()}/yr</span></div>}
                {property.garage && <div className="detail-detail-item"><span className="dd-label">Garage</span><span className="dd-value">{property.garage} {property.garage === 1 ? 'space' : 'spaces'}</span></div>}
                {property.stories && <div className="detail-detail-item"><span className="dd-label">Stories</span><span className="dd-value">{property.stories}</span></div>}
                {property.cooling && <div className="detail-detail-item"><span className="dd-label">Cooling</span><span className="dd-value">{property.cooling}</span></div>}
                {property.heating && <div className="detail-detail-item"><span className="dd-label">Heating</span><span className="dd-value">{property.heating}</span></div>}
                {property.parking && <div className="detail-detail-item"><span className="dd-label">Parking</span><span className="dd-value">{property.parking}</span></div>}
                {property.roof && <div className="detail-detail-item"><span className="dd-label">Roof</span><span className="dd-value">{property.roof}</span></div>}
                {property.viewType && <div className="detail-detail-item"><span className="dd-label">View</span><span className="dd-value">{property.viewType}</span></div>}
                {property.basement && <div className="detail-detail-item"><span className="dd-label">Basement</span><span className="dd-value">{property.basement}</span></div>}
                {property.yearBuilt && <div className="detail-detail-item"><span className="dd-label">Year Built</span><span className="dd-value">{property.yearBuilt}</span></div>}
              </div>
            </div>

            {agentName && (
              <div className="detail-agent-card">
                <div className="detail-agent-header">
                  <div className="property-agent-avatar">{agentName.charAt(0)}</div>
                  <div>
                    <strong>{agentName}</strong>
                    <Suspense fallback={null}><AgentRating id={agentName} name={agentName} /></Suspense>
                    {agentPhone && <span>{agentPhone}</span>}{agentEmail && <span>{agentEmail}</span>}
                  </div>
                </div>
              </div>
            )}

            {openHouses.length > 0 && (
              <div className="detail-oh-card">
                <div className="detail-oh-head">
                  <span className="oh-icon">OPEN</span>
                  <h3>Upcoming Open House</h3>
                </div>
                {openHouses.map(oh => (
                  <div className="detail-oh-item" key={oh.id}>
                    <div className="detail-oh-when">
                      <div className="detail-oh-date">{new Date(oh.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="detail-oh-time">{oh.startTime}{oh.endTime ? ` – ${oh.endTime}` : ''}</div>
                    </div>
                    {oh.description && <p className="detail-oh-desc">{oh.description}</p>}
                    <form className="detail-oh-form" onSubmit={e => { e.preventDefault(); submitOhRsvp(oh); }}>
                      <div className="form-row-2">
                        <input required placeholder="Name" aria-label="Name" className="admin-input" value={ohForm.name} onChange={e => setOhForm({ ...ohForm, name: e.target.value })} />
                        <input required type="email" placeholder="Email" aria-label="Email" className="admin-input" value={ohForm.email} onChange={e => setOhForm({ ...ohForm, email: e.target.value })} />
                      </div>
                      <div className="form-row-2">
                        <input placeholder="Phone" aria-label="Phone number" className="admin-input" value={ohForm.phone} onChange={e => setOhForm({ ...ohForm, phone: e.target.value })} />
                        <select className="admin-input" value={ohForm.guests} onChange={e => setOhForm({ ...ohForm, guests: e.target.value })} aria-label="Number of guests">
                          {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g} {g === 1 ? 'guest' : 'guests'}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="btn-primary btn-block">RSVP to Open House</button>
                      {ohStatus && <p className="form-status-msg">{ohStatus}</p>}
                    </form>
                  </div>
                ))}
              </div>
            )}

            <div className="detail-actions">
              {property.status !== 'Sold' && (
                <button className="btn-primary" onClick={() => setOfferOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Make an Offer
                </button>
              )}
              <button className="btn-ghost" onClick={() => setTourOpen(true)}>Schedule Tour</button>
              <button className="btn-ghost" onClick={() => setCalcOpen(true)}>Calculate Mortgage</button>
              {hasFloorPlans && (
                <button
                  className="btn-ghost floorplan-btn"
                  onClick={() => {
                    const idx = images.length;
                    setMainIdx(idx);
                    setMainImage(galleryImages[idx]);
                    if (galleryTimerRef.current) clearInterval(galleryTimerRef.current);
                    openLightbox(idx);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Floor Plan
                </button>
              )}
              {hasVideo && <button className="btn-ghost video-btn" onClick={scrollToVideo}>Virtual Tour</button>}
              <button className="btn-ghost" onClick={() => setPdfOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                PDF Flyer
              </button>
              <button className="btn-ghost" onClick={() => isInCompare(id) ? removeFromCompare(id) : addToCompare({ ...property, id })}>
                {isInCompare(id) ? 'Remove from Compare' : 'Add to Compare'}
              </button>
              {property.latitude && property.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Directions
                </a>
              )}
              <div className="share-dropdown">
                <button className="btn-ghost" onClick={() => shareSocial('copy')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Share
                </button>
                <div className="share-dropdown-menu">
                  <button onClick={() => shareSocial('facebook')} className="share-option share-fb" aria-label="Share on Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                  <button onClick={() => shareSocial('twitter')} className="share-option share-tw" aria-label="Share on Twitter">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button onClick={() => shareSocial('whatsapp')} className="share-option share-wa" aria-label="Share on WhatsApp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="detail-inquiry">
              <h3>Send an Inquiry</h3>
              <form onSubmit={sendInquiry} className="tour-form">
                <div className="form-row-2">
                  <input type="text" placeholder="Your Name" aria-label="Your name" value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} required />
                  <input type="email" placeholder="Your Email" aria-label="Your email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} required />
                </div>
                <input type="tel" placeholder="Phone (optional)" aria-label="Phone number" value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
                <textarea value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} placeholder="Hi, I'm interested in this property..." aria-label="Message" rows={3} required />
                <button type="submit" className="btn-primary">Send Inquiry</button>
                {inquiryStatus && <p className="form-status-msg">{inquiryStatus}</p>}
              </form>
            </div>

            <div className="detail-price-alert">
              <div className="detail-price-alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M12 2v2"/></svg>
              </div>
              <div>
                <h3>Never Miss a Price Change</h3>
                {priceAlertSent ? (
                  <p className="detail-price-alert-ok">{priceAlertStatus}</p>
                ) : (
                  <form onSubmit={submitPriceAlert} className="detail-price-alert-form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      aria-label="Email for price alerts"
                      value={priceAlertEmail}
                      onChange={(e) => setPriceAlertEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary btn-sm">Get Alerts</button>
                  </form>
                )}
                {priceAlertStatus && !priceAlertSent && <p className="form-status-msg">{priceAlertStatus}</p>}
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <NeighborhoodInsights property={property} />
        </Suspense>

        <Advertisements variant="inline" />

        {priceHistory.length > 0 && (
          <div className="detail-price-history">
            <h2>Price History</h2>
            <div className="price-history-list">
              {priceHistory.slice().reverse().map((h, i) => (
                <div key={h.id || i} className="price-history-item">
                  <span className="price-history-date">{h.date}</span>
                  <span className="price-history-price">${Number(h.price).toLocaleString()}</span>
                  <span className="price-history-note">{h.note || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div className="detail-similar">
            <h2>Similar Properties</h2>
            <div className="property-grid">
              {similar.map((p) => (
                <Link key={p.id || p._id} to={`/property/${p.id || p._id}`} className="similar-card">
                  <SafeImage src={p.image} alt={p.name || p.title} />
                  <div className="similar-card-body">
                    <strong>${p.price ? parseInt(String(p.price).replace(/[$,]/g, '')).toLocaleString() : '—'}</strong>
                    <span>{p.name || p.title}</span>
                    <span>{p.beds} beds · {p.baths} baths · {p.size || p.sqft || '—'} sqft</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {(() => {
        const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (rv.length === 0) return null;
        return (
          <div className="detail-similar" style={{ marginTop: '48px' }}>
            <h2>Recently Viewed</h2>
            <div className="property-grid" style={{ gridTemplateColumns: `repeat(${Math.min(rv.length, 3)}, 1fr)` }}>
              {rv.slice(0, 3).map((p) => (
                <Link key={p.id} to={`/property/${p.id}`} className="similar-card">
                  <SafeImage src={p.image} alt={p.title} />
                  <div className="similar-card-body">
                    <strong>${p.price ? parseInt(String(p.price).replace(/[$,]/g, '')).toLocaleString() : '—'}</strong>
                    <span>{p.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {hasVideo && videoEmbedUrl && (
        <div className="detail-video-section" ref={videoRef}>
          <h2>Virtual Tour</h2>
          <div className="detail-video-wrap">
            <iframe
              src={videoEmbedUrl}
              title={`${displayName} Virtual Tour`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <Lightbox
          isOpen={lightboxOpen}
          images={galleryImages}
          currentIndex={mainIdx}
          imageAlt={displayName}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={(idx) => { setMainIdx(idx); setMainImage(galleryImages[idx]); }}
        />

        <MortgageCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

        {pdfOpen && property && <PDFFlyer property={property} onClose={() => setPdfOpen(false)} />}
      </Suspense>

      {tourOpen && (
        <div className="modal-overlay" onClick={() => setTourOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="tour-title" onKeyDown={(e) => { if (e.key === 'Escape') setTourOpen(false); }}>
            <button className="modal-close" onClick={() => setTourOpen(false)} aria-label="Close tour form">×</button>
            <h2 id="tour-title">Schedule a Tour</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{tourProperty}</p>
            <form onSubmit={scheduleTour} className="tour-form">
              <div className="form-row-2">
                <input type="text" placeholder="Your Name" aria-label="Your name" value={tourForm.name} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} required />
                <input type="email" placeholder="Your Email" aria-label="Your email" value={tourForm.email} onChange={(e) => setTourForm({ ...tourForm, email: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <input type="tel" placeholder="Phone" aria-label="Phone number" value={tourForm.phone} onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })} required />
                <input type="date" value={tourForm.date} onChange={(e) => setTourForm({ ...tourForm, date: e.target.value })} aria-label="Preferred date" required />
              </div>
              <select value={tourForm.time} onChange={(e) => setTourForm({ ...tourForm, time: e.target.value })} aria-label="Preferred time">
                {['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="text" placeholder="Additional notes..." aria-label="Additional notes" value={tourForm.notes} onChange={(e) => setTourForm({ ...tourForm, notes: e.target.value })} />
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Request Tour</button>
              {tourStatus && <p className="form-status-msg">{tourStatus}</p>}
            </form>
          </div>
        </div>
      )}

      {offerOpen && (
        <div className="modal-overlay" onClick={() => setOfferOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="offer-title" onKeyDown={(e) => { if (e.key === 'Escape') setOfferOpen(false); }}>
            <button className="modal-close" onClick={() => setOfferOpen(false)} aria-label="Close offer form">×</button>
            <h2 id="offer-title">Make an Offer</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{displayName} — {priceDisplay}</p>
            <form onSubmit={submitOffer} className="tour-form">
              <div className="form-row-2">
                <input type="text" placeholder="Your Name" aria-label="Your name" value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} required />
                <input type="email" placeholder="Your Email" aria-label="Your email" value={offerForm.email} onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <input type="tel" placeholder="Phone" aria-label="Phone number" value={offerForm.phone} onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })} />
                <input type="number" placeholder="Offer Amount ($)" aria-label="Offer amount in dollars" min="1" value={offerForm.amount} onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })} required />
              </div>
              <textarea rows={3} placeholder="Message to the seller (optional)..." aria-label="Message to seller" value={offerForm.message} onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} />
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Submit Offer</button>
              {offerStatus && <p className="form-status-msg">{offerStatus}</p>}
              {!token && <p className="admin-sub-text" style={{ textAlign: 'center', marginTop: 8 }}>Sign in to track this offer from your profile.</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
