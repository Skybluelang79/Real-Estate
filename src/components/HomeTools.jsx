import { useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageCtx';
import API_URL from '../config';

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
  const [valState, setValState] = useState('CA');
  const [valBeds, setValBeds] = useState(3);
  const [valResult, setValResult] = useState(null);
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState('');

  const principal = Math.max(price - down, 0);
  const monthlyRate = rate / 100 / 12;
  const months = term * 12;
  const monthly =
    monthlyRate > 0
      ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
      : principal / months;
  const totalPayment = monthly * months;
  const totalInterest = totalPayment - principal;

  const runValuation = async (e) => {
    e.preventDefault();
    setValLoading(true);
    setValError('');
    try {
      const res = await fetch(`${API_URL}/api/valuations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: valAddress, city: valCity, state: valState, beds: valBeds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate estimate');
      setValResult(data);
    } catch (err) {
      setValError(err.message);
    } finally {
      setValLoading(false);
    }
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
                <label>{t('home.tools.state')}
                  <input type="text" value={valState} onChange={(e) => setValState(e.target.value.toUpperCase())} maxLength="2" required />
                </label>
              </div>
              <div className="tool-form-row">
                <label>{t('home.tools.beds')}
                  <select value={valBeds} onChange={(e) => setValBeds(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn-primary tool-cta" disabled={valLoading}>{valLoading ? t('home.tools.calculating') || 'Calculating…' : t('home.tools.calculate')}</button>
            </form>
            {valError && <p className="tool-error" style={{ color: '#b00020', marginTop: 10 }}>{valError}</p>}
            {valResult && (
              <div className="tool-results valuation-result">
                <div><span>{t('home.tools.estimate')}</span><strong>{currency(valResult.estimate)}</strong></div>
                <div><span>≈ {valResult.sqft.toLocaleString()} sqft</span><strong>{currency(valResult.perSqft)}/sqft</strong></div>
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
