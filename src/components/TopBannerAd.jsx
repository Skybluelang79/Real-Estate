import { useState, useEffect } from 'react';
import useAds from '../hooks/useAds';

export default function TopBannerAd() {
  const ads = useAds();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('dh-top-banner-dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (dismissed) {
      try { localStorage.setItem('dh-top-banner-dismissed', '1'); } catch {}
    }
  }, [dismissed]);

  if (dismissed || ads.length === 0) return null;
  const ad = ads[0];

  return (
    <div className="top-banner-ad">
      <div className="top-banner-ad-inner">
        <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer" className="top-banner-ad-link">
          {ad.image && <img src={ad.image} alt="" className="top-banner-ad-bg" loading="lazy" />}
          <div className="top-banner-ad-content">
            <span className="ad-badge">Sponsored</span>
            <h3>{ad.title}</h3>
            <p>{ad.description}</p>
            <span className="top-banner-ad-cta">{ad.cta || 'Learn More'} →</span>
          </div>
        </a>
        <button
          className="top-banner-ad-close"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
          aria-label="Dismiss advertisement"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
