import { useState } from 'react';
import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';
import API_URL from '../config';

function currency(num) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);
}

export default function Valuation() {
  usePageTitle('Home Valuation');
  const [form, setForm] = useState({ address: '', city: '', state: '', zip: '', beds: 3, sqft: '', name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/api/valuations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not process your valuation');
      setResult(data);
      setSubmitted(true);
      setStatus(
        form.name
          ? `Thanks, ${form.name}! Your estimate for ${form.address || 'your home'} in ${form.city}, ${form.state} was generated from ${data.comparables} comparable listing${data.comparables === 1 ? '' : 's'}. An agent will be in touch shortly.`
          : `Your estimate for ${form.address || 'your home'} in ${form.city}, ${form.state} was generated from ${data.comparables} comparable listings.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="Home Valuation" />
        <div className="info-page">
          <div className="info-hero">
            <span className="info-hero-icon">📈</span>
            <h1>Free Home Valuation</h1>
            <p>Curious what your home is worth? Enter your details below to get an instant estimate based on comparable listings in your area.</p>
          </div>

          <div className="valuation-layout">
            <div className="valuation-form-card">
              {submitted && status ? (
                <div className="valuation-success">
                  <span className="info-hero-icon">🎉</span>
                  <h2>Your Estimate</h2>
                  {result && (
                    <div className="valuation-estimate-box">
                      <span className="valuation-estimate-range">{currency(result.rangeLow)} – {currency(result.rangeHigh)}</span>
                      <span className="valuation-estimate-main">{currency(result.estimate)}</span>
                      <span className="valuation-estimate-detail">
                        ≈ {result.sqft.toLocaleString()} sqft · {currency(result.perSqft)}/sqft · {result.comparables} comparable{result.comparables === 1 ? '' : 's'} ({result.scope === 'national' ? 'national avg' : result.scope === 'state' ? 'state avg' : 'your city'})
                      </span>
                    </div>
                  )}
                  <p>{status}</p>
                  <Link to="/properties" className="btn-primary" style={{ marginTop: '16px' }}>Browse Properties</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  <h2>Get Your Estimate</h2>
                  {error && <p className="form-error" style={{ color: '#b00020', marginBottom: 12 }}>{error}</p>}
                  <div className="form-group"><label>Street Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required placeholder="123 Dream Street" /></div>
                  <div className="form-row-2">
                    <div className="form-group"><label>City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
                    <div className="form-group"><label>State</label><input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group"><label>ZIP Code</label><input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required /></div>
                    <div className="form-group"><label>Bedrooms</label>
                      <select value={form.beds} onChange={(e) => setForm({ ...form, beds: Number(e.target.value) })}>
                        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>Approx. Sq Ft (optional)</label><input type="number" value={form.sqft} onChange={(e) => setForm({ ...form, sqft: e.target.value })} placeholder="e.g. 1800" /></div>
                  <div className="form-group"><label>Your Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                    {loading ? 'Calculating…' : 'Get My Free Valuation'}
                  </button>
                  <p className="admin-sub-text" style={{ marginTop: 12, textAlign: 'center' }}>No obligation. Your information stays private.</p>
                </form>
              )}
            </div>

            <div className="valuation-info">
              <h2>Why Get a Valuation?</h2>
              <ul className="valuation-list">
                <li><strong>Instant estimate</strong> — priced against comparable listings in your area.</li>
                <li><strong>Know your number</strong> — understand your equity and what buyers will pay.</li>
                <li><strong>Set the right price</strong> — overpricing and underpricing both cost you money.</li>
                <li><strong>Agent-backed accuracy</strong> — add your contact details and a local agent will refine your estimate within 24 hours.</li>
              </ul>
              <Link to="/financing" className="btn-ghost">Explore Financing Options</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
