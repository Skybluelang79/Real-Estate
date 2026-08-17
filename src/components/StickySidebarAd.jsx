import { useState, useEffect } from 'react';
import useAds from '../hooks/useAds';

export default function StickySidebarAd() {
  const ads = useAds();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('dh-sticky-ad-dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (dismissed || ads.length === 0 || !visible) return null;
  const ad = ads[2] || ads[0];

  return (
    <div className="sticky-sidebar-ad">
      <button
        className="sticky-sidebar-ad-close"
        onClick={() => {
          setDismissed(true);
          try { localStorage.setItem('dh-sticky-ad-dismissed', '1'); } catch {}
        }}
        aria-label="Close advertisement"
      >
        ✕
      </button>
      <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer" className="sticky-sidebar-ad-link">
        {ad.image && <img src={ad.image} alt={ad.title} loading="lazy" />}
        <div className="sticky-sidebar-ad-body">
          <span className="ad-badge">Sponsored</span>
          <h4>{ad.title}</h4>
          <p>{ad.description}</p>
          <span className="sticky-sidebar-ad-cta">{ad.cta || 'Learn More'} →</span>
        </div>
      </a>
    </div>
  );
}
