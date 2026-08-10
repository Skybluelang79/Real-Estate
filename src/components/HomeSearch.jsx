import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import API_URL from '../config';

export default function HomeSearch() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [all, setAll] = useState([]);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/properties?limit=500`)
      .then((r) => r.json())
      .then((d) => setAll(d.properties || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const q = keyword.trim().toLowerCase();
  const suggestions = q
    ? all
        .filter((p) =>
          [p.title, p.city, p.state, p.address, p.zip, p.type].some((v) => v && String(v).toLowerCase().includes(q))
        )
        .slice(0, 6)
    : [];

  const go = (params) => navigate(`/properties${params.toString() ? `?${params.toString()}` : ''}`);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    go(params);
  };

  const pick = (p) => {
    setFocused(false);
    setKeyword('');
    navigate(`/property/${p.id || p._id}`);
  };

  const formatPrice = (price) => {
    const num = parseInt(String(price).replace(/[$,]/g, ''), 10);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${(num || 0).toLocaleString()}`;
  };

  return (
    <form className="home-search" onSubmit={handleSubmit} role="search">
      <div className="home-search-field home-search-keyword" ref={boxRef}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t('search.keyword')}
          aria-label={t('search.keyword')}
          autoComplete="off"
        />
        {focused && suggestions.length > 0 && (
          <div className="home-search-suggestions">
            {suggestions.map((p) => (
              <button type="button" key={p.id || p._id} className="home-search-suggestion" onClick={() => pick(p)}>
                <span className="home-search-suggestion-name">{p.title}</span>
                <span className="home-search-suggestion-meta">
                  {p.city}, {p.state} · {formatPrice(p.price)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <label className="home-search-field">
        <span className="home-search-label">{t('search.type')}</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('search.anyType')}</option>
          <option value="House">House</option>
          <option value="Apartment">Apartment</option>
          <option value="Condo">Condo</option>
          <option value="Villa">Villa</option>
          <option value="Penthouse">Penthouse</option>
          <option value="Townhouse">Townhouse</option>
        </select>
      </label>
      <label className="home-search-field">
        <span className="home-search-label">{t('search.status')}</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('search.anyStatus')}</option>
          <option value="For Sale">{t('properties.forSale')}</option>
          <option value="For Rent">{t('properties.forRent')}</option>
        </select>
      </label>
      <button type="submit" className="home-search-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        {t('search.submit')}
      </button>
    </form>
  );
}
