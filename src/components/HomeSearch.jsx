import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';

export default function HomeSearch() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    navigate(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form className="home-search" onSubmit={handleSubmit} role="search">
      <div className="home-search-field home-search-keyword">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('search.keyword')}
          aria-label={t('search.keyword')}
        />
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
