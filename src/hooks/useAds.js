import { useState, useEffect } from 'react';
import API_URL from '../config';
import { FALLBACK_ADS } from '../data/fallbackAds';

export default function useAds() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/ads`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAds(d.ads && d.ads.length > 0 ? d.ads : FALLBACK_ADS);
      })
      .catch(() => {
        if (!cancelled) setAds(FALLBACK_ADS);
      });
    return () => { cancelled = true; };
  }, []);

  return ads;
}
