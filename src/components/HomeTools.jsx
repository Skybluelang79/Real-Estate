import { useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';

function currency(num) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);
}

export default function HomeTools() {
  const { t } = useLanguage();
  const [price, setPrice] = useState(2000000);
  const [down, setDown] = useState(400000);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);

  const [valAddress, setValAddress] = useState('');
  const [valCity, setValCity] = useState('');
  const [valBeds, setValBeds] = useState(3);
  const [valResult, setValResult] = useState(null);

  const principal = Math.max(price - down, 0);
  const monthlyRate = rate / 100 / 12;
  const months = term * 12;
  const monthly =
    monthlyRate > 0
      ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
      : principal / months;
  const totalPayment = monthly * months;
  const totalInterest = totalPayment - principal;

  const runValuation = (e) => {
    e.preventDefault();
    const base = 180 + valBeds * 42;
    const noise = Math.round((Math.random() - 0.5) * 24);
    const perSqft = 625 + Math.random() * 110;
    const sqft = base * 100 + Math.round(Math.random() * 40) * 10;
    const estimate = Math.round((sqft * perSqft * (1 + noise / 100)) / 1000) * 1000;
    setValResult({ sqft, estimate });
  };

  return (
    <section className="section home-tools-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('home.tools.title')}</h2>
          <p>{t('home.tools.subtitle')}</p>
        </div>
        <div className="home-tools-grid">
          <div className="home-tool-card">
            <div className="home-tool-head">
              <div className="home-tool-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V9l9-6 9 6v13"/><path d="M9 22v-6h6v6"/></svg>
              </div>
              <div>
                <h3>{t('home.tools.mortgageTitle')}</h3>
                <p>{t('home.tools.mortgageDesc')}</p>
              </div>
            </div>
            <div className="tool-form">
              <label>{t('home.tools.price')}
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min="0" step="10000" />
              </label>
              <label>{t('home.tools.down')}
                <input type="number" value={down} onChange={(e) => setDown(Number(e.target.value))} min="0" step="10000" />
              </label>
              <div className="tool-form-row">
                <label>{t('home.tools.rate')}
                  <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} min="0" max="20" step="0.1" />
                </label>
                <label>{t('home.tools.term')}
                  <select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                    <option value={15}>15 {t('home.tools.years')}</option>
                    <option value={20}>20 {t('home.tools.years')}</option>
                    <option value={30}>30 {t('home.tools.years')}</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="tool-results">
              <div><span>{t('home.tools.monthly')}</span><strong>{currency(monthly)}</strong></div>
              <div><span>{t('home.tools.totalInterest')}</span><strong>{currency(totalInterest)}</strong></div>
              <div><span>{t('home.tools.totalPayment')}</span><strong>{currency(totalPayment)}</strong></div>
            </div>
            <Link to="/financing" className="btn-primary btn-sm tool-cta">{t('home.tools.learnMore')} →</Link>
          </div>

          <div className="home-tool-card">
            <div className="home-tool-head">
              <div className="home-tool-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <h3>{t('home.tools.valuationTitle')}</h3>
                <p>{t('home.tools.valuationDesc')}</p>
              </div>
            </div>
            <form className="tool-form" onSubmit={runValuation}>
              <label>{t('home.tools.address')}
                <input type="text" value={valAddress} onChange={(e) => setValAddress(e.target.value)} placeholder={t('home.tools.addressPh')} required />
              </label>
              <div className="tool-form-row">
                <label>{t('home.tools.city')}
                  <input type="text" value={valCity} onChange={(e) => setValCity(e.target.value)} required />
                </label>
                <label>{t('home.tools.beds')}
                  <select value={valBeds} onChange={(e) => setValBeds(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn-primary tool-cta">{t('home.tools.calculate')}</button>
            </form>
            {valResult && (
              <div className="tool-results valuation-result">
                <div><span>{t('home.tools.estimate')}</span><strong>{currency(valResult.estimate)}</strong></div>
                <div><span>≈ {valResult.sqft.toLocaleString()} sqft</span><strong>{currency(Math.round(valResult.estimate / valResult.sqft))}/sqft</strong></div>
              </div>
            )}
            <p className="tool-disclaimer">{t('home.tools.estimateResult')}</p>
            <Link to="/valuation" className="btn-ghost btn-sm tool-cta">{t('home.tools.valuationCta')} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
