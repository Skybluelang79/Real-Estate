import { useEffect, useRef } from 'react';

const DEFAULT_ADSENSE_ID = ''; // Set your AdSense publisher ID here

export default function GoogleAdSlot({
  slot = '0000000000',
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}) {
  const adRef = useRef(null);
  const adSenseId = DEFAULT_ADSENSE_ID;

  useEffect(() => {
    if (!adSenseId || !adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [adSenseId]);

  if (!adSenseId) {
    return (
      <div className={`google-ad-placeholder ${className}`} style={style}>
        <div className="google-ad-placeholder-inner">
          <span className="google-ad-label">Advertisement</span>
          <div className="google-ad-placeholder-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>Ad Space</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-ad-slot ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
