import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_URL from '../config';
import SafeImage from './SafeImage';
import { useLanguage } from '../context/LanguageCtx';

const center = [34.0522, -118.2437];

function markerIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="mini-map-marker">
      <svg width="30" height="38" viewBox="0 0 36 44" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#C9A84C" stroke="#FAFAF8" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="7" fill="#1A1714"/>
      </svg>
    </div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

export default function MiniMap() {
  const { t } = useLanguage();
  const [properties, setProperties] = useState([]);
  const icon = useMemo(() => markerIcon(), []);

  useEffect(() => {
    fetch(`${API_URL}/api/properties?limit=30`)
      .then((r) => r.json())
      .then((d) => setProperties(d.properties || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sheet = document.createElement('style');
    sheet.textContent = '.mini-map-wrap .leaflet-popup-content-wrapper, .mini-map-wrap .leaflet-popup-tip { border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.14); }';
    document.head.appendChild(sheet);
    return () => sheet.remove();
  }, []);

  if (properties.length === 0) return null;

  const formatPrice = (price) => {
    const num = parseInt(String(price).replace(/[$,]/g, ''), 10);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${(num || 0).toLocaleString()}`;
  };

  return (
    <section className="section mini-map-section">
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <h2>{t('home.map.title')}</h2>
            <p>{t('home.map.subtitle')}</p>
          </div>
          <div className="section-header-actions">
            <Link to="/map" className="btn-ghost btn-sm">{t('home.map.viewFullMap')}</Link>
          </div>
        </div>
        <div className="mini-map-wrap">
          <MapContainer center={center} zoom={9} scrollWheelZoom={false} style={{ height: '380px', width: '100%', borderRadius: 12 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {properties.slice(0, 30).map((p) =>
              p.latitude && p.longitude ? (
                <Marker key={p.id || p._id} position={[p.latitude, p.longitude]} icon={icon}>
                  <Popup>
                    <Link to={`/property/${p.id || p._id}`} className="mini-map-popup">
                      <div className="mini-map-popup-img">
                        <SafeImage src={p.image} alt={p.title} />
                      </div>
                      <strong>{p.title}</strong>
                      <span>{formatPrice(p.price)} · {p.beds} bd</span>
                    </Link>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
