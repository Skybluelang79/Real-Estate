import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Cluster from 'react-leaflet-cluster';
import { keepPreviousData } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_URL from '../config';
import SafeImage from '../components/SafeImage';
import usePageTitle from '../hooks/usePageTitle';
import useDebounce from '../hooks/useDebounce';
import { usePropertiesQuery } from '../api/properties';
import { formatPrice } from '../utils/format';
import { haversineDistance, getDirectionsUrl } from '../utils/geo';

const defaultCenter = [34.0522, -118.2437];

function createIcon(active, price, sponsored) {
  const size = active ? 52 : 44;
  const color = sponsored ? '#E85D3A' : (active ? '#C9A84C' : '#1A1714');
  const bg = sponsored ? '#E85D3A' : (active ? '#C9A84C' : '#C9A84C');
  const innerFill = active ? '#FAFAF8' : '#1A1714';
  return L.divIcon({
    className: '',
    html: `<div class="map-marker ${active ? 'map-marker-active' : ''} ${sponsored ? 'map-marker-sponsored' : ''}" style="--marker-color: ${bg}">
      <svg width="${size}" height="${size + 8}" viewBox="0 0 36 44" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="${bg}" stroke="#FAFAF8" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="8" fill="${innerFill}"/>
        <circle cx="18" cy="18" r="4" fill="${bg}"/>
      </svg>
      <span class="map-marker-price">${price}</span>
    </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 14)],
  });
}

const userIcon = L.divIcon({
  className: '',
  html: `<div class="map-marker map-marker-user">
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#2563EB" stroke="#fff" stroke-width="3"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count >= 50 ? 52 : count >= 10 ? 44 : 36;
  return L.divIcon({
    className: 'map-cluster-wrap',
    html: `<div class="map-cluster" style="--cluster-size:${size}px"><span>${count}</span></div>`,
    iconSize: L.point(size, size),
  });
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, Math.max(map.getZoom(), 13), { duration: 0.5 });
  }, [coords, map]);
  return null;
}

function MapBounds({ properties }) {
  const map = useMap();
  useEffect(() => {
    const valid = properties.filter(p => p.latitude && p.longitude);
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    }
  }, [properties, map]);
  return null;
}

function LocateButton({ onLocate }) {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-left map-side-controls map-side-controls-locate">
      <button className="map-control-btn" onClick={() => {
        map.locate({ setView: true, maxZoom: 14 });
        map.once('locationfound', (e) => onLocate([e.latlng.lat, e.latlng.lng]));
        map.once('locationerror', () => {});
      }} title="My Location">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
      </button>
    </div>
  );
}

function LayerToggle({ layer, onChange }) {
  return (
    <div className="leaflet-top leaflet-left map-side-controls map-side-controls-layer">
      <button className="map-control-btn" onClick={() => onChange(layer === 'street' ? 'dark' : 'street')} title={layer === 'street' ? 'Switch to Satellite' : 'Switch to Street'}>
        {layer === 'street' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10a10 10 0 0 1 16 0"/>
            <path d="M12 10v8"/>
            <path d="M9 13l-4 4"/>
            <path d="M15 13l4 4"/>
            <path d="M12 18v3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function SponsoredBadge() {
  return (
    <span className="map-sponsored-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      Sponsored
    </span>
  );
}

const ads = [
  { id: 'ad1', title: 'Pre-Approved?', subtitle: 'Lock in 4.5% APR today', link: '/financing', color: '#C9A84C' },
  { id: 'ad2', title: 'Free Home Valuation', subtitle: 'Know your home\'s worth', link: '/valuation', color: '#8B7355' },
];

export default function MapView() {
  usePageTitle('Map View');
  const [selectedId, setSelectedId] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768));
  const [filtersOpen, setFiltersOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768));

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBeds, setFilterBeds] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterAmenities, setFilterAmenities] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  const [userLocation, setUserLocation] = useState(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [filterRadius, setFilterRadius] = useState('');
  const [layer, setLayer] = useState('street');
  const [sidebarIndex, setSidebarIndex] = useState(-1);
  const [hoveredId, setHoveredId] = useState(null);
  const drawerRef = useRef(null);

  const debouncedSearch = useDebounce(searchText, 400);
  const debouncedMinPrice = useDebounce(filterMinPrice, 400);
  const debouncedMaxPrice = useDebounce(filterMaxPrice, 400);

  const params = {
    search: debouncedSearch,
    type: filterType,
    beds: filterBeds,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    amenities: filterAmenities,
    availability: filterAvailability,
    limit: 200,
  };

  const { data, isLoading, isError, refetch } = usePropertiesQuery(params, {
    placeholderData: keepPreviousData,
  });

  const properties = data?.properties || [];

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
    );
  }, []);

  const validProperties = useMemo(() =>
    properties.filter(p => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))),
    [properties]
  );

  const visibleProperties = useMemo(() => {
    if (userLocation && validProperties.length > 0) {
      const [ulat, ulng] = userLocation;
      const withDist = validProperties.map(p => ({
        ...p,
        _dist: haversineDistance(ulat, ulng, parseFloat(p.latitude), parseFloat(p.longitude)),
      }));
      const radiusMiles = parseFloat(filterRadius);
      const filtered = radiusMiles > 0 ? withDist.filter(p => p._dist <= radiusMiles) : withDist;
      if (sortByDistance) {
        return filtered.sort((a, b) => a._dist - b._dist);
      }
      return filtered;
    }
    return validProperties;
  }, [validProperties, sortByDistance, userLocation, filterRadius]);

  const selectProperty = useCallback((pid) => {
    setSelectedId(pid);
    const p = properties.find(x => (x.id || x._id) === pid);
    if (p) setFlyTo([parseFloat(p.latitude), parseFloat(p.longitude)]);
    const idx = visibleProperties.findIndex(x => (x.id || x._id) === pid);
    setSidebarIndex(idx);
  }, [properties, visibleProperties]);

  const clearFilters = () => {
    setSearchText(''); setFilterType(''); setFilterBeds('');
    setFilterMinPrice(''); setFilterMaxPrice(''); setFilterAmenities(''); setFilterAvailability('');
    setFilterRadius('');
  };

  const hasFilters = searchText || filterType || filterBeds || filterMinPrice || filterMaxPrice || filterAmenities || filterAvailability || filterRadius;
  const filterCount = [searchText, filterType, filterBeds, filterMinPrice, filterMaxPrice, filterAmenities, filterAvailability, filterRadius].filter(Boolean).length;

  const tileUrl = layer === 'street'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const tileAttr = layer === 'street'
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.esri.com/">Esri</a>';

  const handleKeyDown = useCallback((e) => {
    if (visibleProperties.length === 0) return;
    let idx = sidebarIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') idx = Math.min(sidebarIndex + 1, visibleProperties.length - 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') idx = Math.max(sidebarIndex - 1, 0);
    else return;
    e.preventDefault();
    const p = visibleProperties[idx];
    if (p) selectProperty(p.id || p._id);
  }, [sidebarIndex, visibleProperties, selectProperty]);

  const currentProperty = useMemo(() => {
    if (!selectedId) return null;
    return properties.find(p => (p.id || p._id) === selectedId);
  }, [selectedId, properties]);

  const listProperties = isError ? [] : visibleProperties;

  return (
    <section className="map-view-page" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="map-overlay-top">
        <div className="map-overlay-header">
          <h1>Explore Properties</h1>
          <p className="map-overlay-subtitle">{validProperties.length} homes in {layer === 'street' ? 'Street' : 'Satellite'} view</p>
          <button
            className={`map-filters-toggle ${filtersOpen ? 'map-filters-toggle-open' : ''}`}
            onClick={() => setFiltersOpen(o => !o)}
            aria-expanded={filtersOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
            Filters
            {filterCount > 0 && <span className="map-filters-count">{filterCount}</span>}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="map-filters-caret">
              {filtersOpen ? <path d="M6 9l6 6 6-6"/> : <path d="M6 15l6-6 6 6"/>}
            </svg>
          </button>
        </div>
        <div className={`map-search-bar ${filtersOpen ? 'map-search-bar-open' : 'map-search-bar-closed'}`}>
          <div className="map-search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search by city, address, or ZIP..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Villa">Villa</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Cottage">Cottage</option>
            <option value="Retail">Retail</option>
          </select>
          <select value={filterBeds} onChange={e => setFilterBeds(e.target.value)}>
            <option value="">Any Beds</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
          </select>
          <select value={filterAmenities} onChange={e => setFilterAmenities(e.target.value)}>
            <option value="">Any Amenities</option>
            <option value="Pool">Pool</option>
            <option value="Gym">Gym</option>
            <option value="Garden">Garden</option>
            <option value="Fireplace">Fireplace</option>
            <option value="Parking">Parking</option>
            <option value="Ocean View">Ocean View</option>
            <option value="Smart Home">Smart Home</option>
            <option value="Concierge">Concierge</option>
            <option value="Rooftop">Rooftop</option>
          </select>
          <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)}>
            <option value="">Any Availability</option>
            <option value="Available Now">Available Now</option>
            <option value="Available Soon">Available Soon</option>
            <option value="By Appointment">By Appointment</option>
            <option value="Lease to Own">Lease to Own</option>
            <option value="Sold">Sold</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={filterRadius}
            onChange={e => setFilterRadius(e.target.value)}
            disabled={!userLocation}
            title={userLocation ? 'Show homes within this radius of your location' : 'Enable location access to search by radius'}
            className="map-radius-select"
          >
            <option value="">Any Distance</option>
            <option value="5">Within 5 mi</option>
            <option value="10">Within 10 mi</option>
            <option value="15">Within 15 mi</option>
            <option value="25">Within 25 mi</option>
            <option value="50">Within 50 mi</option>
          </select>
          <input type="number" placeholder="Min $" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} className="map-price-in" />
          <input type="number" placeholder="Max $" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} className="map-price-in" />
          <button
            className={`map-nearest-btn ${sortByDistance ? 'map-nearest-btn-active' : ''}`}
            onClick={() => setSortByDistance(s => !s)}
            disabled={!userLocation}
            title={userLocation ? 'Sort by distance from your location' : 'Enable location access to sort by distance'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>
            Nearest
          </button>
          {hasFilters && (
            <button className="map-clear-btn-sm" onClick={clearFilters}>Clear</button>
          )}
        </div>
      </div>

      <div className="map-main-area">
        <div className="map-canvas">
          {isError && !data ? (
            <div className="map-empty map-error">
              <div>
                <p>Couldn't load properties.</p>
                <button className="map-clear-btn-sm" onClick={() => refetch()}>Retry</button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="map-loading"><div className="spinner" /></div>
          ) : listProperties.length === 0 ? (
            <div className="map-empty">
              <p>No properties found in this area.</p>
            </div>
          ) : (
            <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer attribution={tileAttr} url={tileUrl} />
              <MapBounds properties={validProperties} />
              <FlyTo coords={flyTo} />
              <LocateButton onLocate={setUserLocation} />
              <LayerToggle layer={layer} onChange={setLayer} />
              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>Your location</Popup>
                </Marker>
              )}
              <Cluster
                iconCreateFunction={clusterIcon}
                showCoverageOnHover={false}
                zoomToBoundsOnClick
                chunkedLoading
              >
                {visibleProperties.map((p) => {
                  const pid = p.id || p._id;
                  const isHovered = hoveredId === pid;
                  const isSelected = selectedId === pid;
                  const sponsored = pid === 5 || pid === 6;
                  return (
                    <Marker
                      key={pid}
                      position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                      icon={createIcon(isSelected || isHovered, formatPrice(p.price), sponsored)}
                      eventHandlers={{
                        click: () => selectProperty(pid),
                        mouseover: () => setHoveredId(pid),
                        mouseout: () => setHoveredId(null),
                      }}
                    >
                      <Popup closeButton={false} maxWidth={280}>
                        <div className="map-popup-card">
                          <div className="map-popup-img-wrap">
                            <SafeImage src={p.image} alt={p.title || p.name} />
                            {sponsored && <SponsoredBadge />}
                          </div>
                          <div className="map-popup-body">
                            <div className="map-popup-price">{formatPrice(p.price)}</div>
                            {p.availability && <span className="map-popup-avail">{p.availability}</span>}
                            <strong>{p.title || p.name}</strong>
                            <span className="map-popup-location">{p.city}, {p.state} {p.zipcode || ''}</span>
                            <span className="map-popup-specs">{p.beds} beds · {p.baths} baths · {p.sqft || p.size || '—'} sqft</span>
                            <div className="map-popup-cta">
                              <Link to={`/property/${pid}`} className="btn-primary btn-sm">View Details</Link>
                              <a href={getDirectionsUrl(p.latitude, p.longitude, p.address)} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">Directions</a>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </Cluster>
            </MapContainer>
          )}

          <div className="map-ads">
            {ads.map(ad => (
              <Link key={ad.id} to={ad.link} className="map-ad-banner" style={{ '--ad-color': ad.color }}>
                <div className="map-ad-content">
                  <strong>{ad.title}</strong>
                  <span>{ad.subtitle}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            ))}
          </div>
        </div>

        <div className={`map-drawer ${drawerOpen ? 'map-drawer-open' : 'map-drawer-closed'}`} ref={drawerRef}>
          <div className="map-drawer-header" onClick={() => setDrawerOpen(o => !o)}>
            <span className="map-drawer-title">
              {selectedId ? currentProperty?.title || 'Property' : `${listProperties.length} Properties`}
            </span>
            <div className="map-drawer-actions">
              <span className="map-drawer-hint">↑↓ navigate</span>
              <button className="map-drawer-toggle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {drawerOpen ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
                </svg>
              </button>
            </div>
          </div>
          <div className="map-drawer-list">
            {listProperties.map((p, i) => {
              const pid = p.id || p._id;
              const isSelected = selectedId === pid;
              const dist = userLocation && p.latitude && p.longitude
                ? haversineDistance(userLocation[0], userLocation[1], parseFloat(p.latitude), parseFloat(p.longitude))
                : null;
              const sponsored = pid === 5 || pid === 6;
              return (
                <div
                  key={pid}
                  className={`map-drawer-item ${isSelected ? 'map-drawer-item-active' : ''}`}
                  onMouseEnter={() => setHoveredId(pid)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => selectProperty(pid)}
                >
                  <div className="map-drawer-item-img">
                    <SafeImage src={p.image} alt={p.title || p.name} />
                    {sponsored && <SponsoredBadge />}
                  </div>
                  <div className="map-drawer-item-info">
                    <div className="map-drawer-item-price">{formatPrice(p.price)}</div>
                    <strong>{p.title || p.name}</strong>
                    <span className="map-drawer-item-addr">{p.city}{p.state ? `, ${p.state}` : ''}</span>
                    <span className="map-drawer-item-meta">{p.beds} bd · {p.baths} ba · {p.sqft || p.size || '—'} sqft</span>
                    {p.availability && <span className="map-drawer-item-avail">{p.availability}</span>}
                    {p.amenities && p.amenities.length > 0 && (
                      <div className="map-drawer-item-amenities">
                        {p.amenities.slice(0, 3).map((a, i) => <span key={i} className="map-drawer-amenity">{a}</span>)}
                        {p.amenities.length > 3 && <span className="map-drawer-amenity-more">+{p.amenities.length - 3}</span>}
                      </div>
                    )}
                    {dist !== null && <span className="map-drawer-item-dist">{dist.toFixed(1)} mi away</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
