import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import CanvasBackground from './CanvasBackground';
import HomeSearch from './HomeSearch';
import { useLanguage } from '../context/LanguageCtx';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
    title: 'Where Elegance Meets Comfort',
    subtitle: 'Discover an curated collection of the world\'s most exceptional properties',
  },
  {
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    title: 'Extraordinary Living Spaces',
    subtitle: 'Meticulously designed residences crafted for discerning clientele',
  },
  {
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7a75b3?w=1920&q=80',
    title: 'Your Legacy Awaits',
    subtitle: 'Timeless estates in the world\'s most coveted destinations',
  },
];

export default function Hero({ properties = [] }) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef(null);

  const formatPrice = (price) => {
    const num = parseInt(String(price).replace(/[$,]/g, ''), 10);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${(num || 0).toLocaleString()}`;
  };

  const brandSlides = t('hero', slides);
  const heroSlides = Array.isArray(properties) && properties.length > 0
    ? properties.map((p) => ({
        image: p.image,
        title: p.title || p.name,
        subtitle: `${p.city || ''}${p.city && p.state ? ', ' : ''}${p.state || ''} · ${formatPrice(p.price)}`,
        link: `/property/${p.id || p._id}`,
        price: p.price,
      }))
    : brandSlides.map((s) => ({ ...s, link: '/properties' }));

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!paused) startInterval();
    return () => clearInterval(intervalRef.current);
  }, [paused, startInterval]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      className="hero-slider"
      role="region"
      aria-label="Property slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-slides">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide ${i === current ? 'hero-slide-active' : ''}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
          />
        ))}
        <div className="hero-overlay" />
        <CanvasBackground className="hero-canvas" />
      </div>

      <div className="hero-content">
        <div className="hero-content-inner">
          <h1 className="hero-title">{heroSlides[current].title}</h1>
          <p className="hero-subtitle">{heroSlides[current].subtitle}</p>
          <div className="hero-accent-line" />
          <Link to={heroSlides[current].link || '/properties'} className="btn-primary hero-cta">
            {heroSlides[current].link && heroSlides[current].link !== '/properties' ? t('home.viewListing') || 'View Listing' : t('heroCta')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <HomeSearch />
          <div className="hero-trust">
            <span className="hero-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              4.9 Client Rating
            </span>
            <span className="hero-trust-sep" />
            <span className="hero-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Verified Listings
            </span>
            <span className="hero-trust-sep" />
            <span className="hero-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              8+ Expert Agents
            </span>
            <span className="hero-trust-sep" />
            <span className="hero-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 22V7l9-5 9 5v15"/><path d="M9 22V12h6v10"/></svg>
              250+ Listings
            </span>
          </div>
        </div>
      </div>

      <div className="hero-dots">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        className="hero-arrow hero-arrow-left"
        onClick={() => setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
        aria-label="Previous slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        className="hero-arrow hero-arrow-right"
        onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
        aria-label="Next slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div className="hero-scroll-indicator">
        <span>{t('scroll')}</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="14" height="22" rx="7" />
          <circle cx="8" cy="8" r="2" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
