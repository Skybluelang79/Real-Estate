import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import CanvasBackground from './CanvasBackground';
import HomeSearch from './HomeSearch';
import { useLanguage } from '../context/LanguageContext';

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

export default function Hero() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef(null);
  const heroSlides = t('hero', slides);

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
          <Link to="/properties" className="btn-primary hero-cta">
            {t('heroCta')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <HomeSearch />
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
