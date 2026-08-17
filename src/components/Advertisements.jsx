import { useState, useEffect, useCallback, useRef } from 'react';
import useAds from '../hooks/useAds';

function AdCanvas({ ad: _ad, isActive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.3 + 0.1,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${p.o})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  if (!isActive) return null;
  return <canvas ref={canvasRef} className="ad-canvas-bg" />;
}

function AdBanner({ ad, isActive }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={`ad-banner ${isActive ? 'ad-banner-active' : ''}`}>
      <AdCanvas ad={ad} isActive={isActive} />
      {ad.image && (
        <div className={`ad-banner-img-wrap ${imgLoaded ? 'ad-img-loaded' : ''}`}>
          <img src={ad.image} alt={ad.title} onLoad={() => setImgLoaded(true)} loading="lazy" />
          <div className="ad-gradient-overlay" />
        </div>
      )}
      <div className="ad-banner-content">
        <span className="ad-badge">Sponsored</span>
        <h3>{ad.title}</h3>
        <p>{ad.description}</p>
        {ad.link && (
          <a href={ad.link} className="btn-primary ad-cta" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            {ad.cta || 'Learn More'}
          </a>
        )}
      </div>
    </div>
  );
}

function AdDots({ ads, current, onChange }) {
  if (ads.length <= 1) return null;
  return (
    <div className="ads-dots">
      {ads.map((ad, i) => (
        <button key={ad.id} className={`ads-dot ${i === current ? 'ads-dot-active' : ''}`} onClick={() => onChange(i)} aria-label={`Ad ${i + 1}`} />
      ))}
    </div>
  );
}

export default function Advertisements({ variant = 'hero' }) {
  const ads = useAds();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (ads.length === 0) return;
    setCurrent(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [ads.length, next]);

  if (ads.length === 0) return null;

  if (variant === 'sidebar') {
    return (
      <div className="ad-sidebar">
        <span className="ad-sidebar-label">Sponsor</span>
        <div className="ad-sidebar-inner">
          {ads.slice(0, 1).map(ad => (
            <a key={ad.id} href={ad.link || '#'} className="ad-sidebar-card" target="_blank" rel="noopener noreferrer">
              {ad.image && <div className="ad-sidebar-img" style={{ backgroundImage: `url(${ad.image})` }} />}
              <div className="ad-sidebar-body">
                <h4>{ad.title}</h4>
                <p>{ad.description}</p>
                <span className="ad-sidebar-cta">{ad.cta || 'Learn More'} →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="ad-inline">
        {ads.slice(0, 1).map(ad => (
          <a key={ad.id} href={ad.link || '#'} className="ad-inline-card" target="_blank" rel="noopener noreferrer">
            {ad.image && <img src={ad.image} alt={ad.title} loading="lazy" />}
            <div className="ad-inline-body">
              <span className="ad-badge-sm">Ad</span>
              <h4>{ad.title}</h4>
              <p>{ad.description}</p>
            </div>
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'showcase') {
    return (
      <section className="ads-showcase-section">
        <div className="container">
          <div className="ads-showcase-header">
            <span className="ads-showcase-kicker">Curated Partners</span>
            <h2>Featured Brands &amp; Partners</h2>
            <p>Trusted names we work with to make every move effortless and every home exceptional.</p>
          </div>
          <div className="ads-showcase-grid">
            {ads.slice(0, 3).map((ad, i) => (
              <a key={ad.id} href={ad.link || '#'} className="ads-showcase-card" target="_blank" rel="noopener noreferrer" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="ads-showcase-media">
                  {ad.image && <img src={ad.image} alt={ad.title} loading="lazy" />}
                  <div className="ads-showcase-overlay" />
                  <span className="ads-showcase-tag">Sponsored</span>
                </div>
                <div className="ads-showcase-body">
                  <h3>{ad.title}</h3>
                  <p>{ad.description}</p>
                  <span className="ads-showcase-cta">
                    {ad.cta || 'Learn More'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ads-section">
      <div className="ads-carousel">
        {ads.map((ad, i) => (
          <AdBanner key={ad.id} ad={ad} isActive={i === current} />
        ))}
      </div>
      <AdDots ads={ads} current={current} onChange={setCurrent} />
    </section>
  );
}