import { useState } from 'react';
import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';

export default function Valuation() {
  usePageTitle('Home Valuation');
  const [form, setForm] = useState({ address: '', city: '', state: '', zip: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setStatus(`Thanks! One of our agents will contact you shortly with a valuation for ${form.address || 'your home'}, ${form.city || ''} ${form.state || ''}.`);
  };

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="Home Valuation" />
        <div className="info-page">
          <div className="info-hero">
            <span className="info-hero-icon">📈</span>
            <h1>Free Home Valuation</h1>
            <p>Curious what your home is worth? Enter your address below and get a free, no-obligation estimate from a Dream Homes agent within 24 hours.</p>
          </div>

          <div className="valuation-layout">
            <div className="valuation-form-card">
              {submitted && status ? (
                <div className="valuation-success">
                  <span className="info-hero-icon">🎉</span>
                  <h2>Request Received!</h2>
                  <p>{status}</p>
                  <Link to="/properties" className="btn-primary" style={{ marginTop: '16px' }}>Browse Properties</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  <h2>Get Your Estimate</h2>
                  <div className="form-group"><label>Street Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required placeholder="123 Dream Street" /></div>
                  <div className="form-row-2">
                    <div className="form-group"><label>City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
                    <div className="form-group"><label>State</label><input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></div>
                  </div>
                  <div className="form-group"><label>ZIP Code</label><input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required /></div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Get My Free Valuation</button>
                  <p className="admin-sub-text" style={{ marginTop: 12, textAlign: 'center' }}>No obligation. Your information stays private.</p>
                </form>
              )}
            </div>

            <div className="valuation-info">
              <h2>Why Get a Valuation?</h2>
              <ul className="valuation-list">
                <li><strong>Know your number</strong> — understand your equity and what buyers will pay.</li>
                <li><strong>Set the right price</strong> — overpricing and underpricing both cost you money.</li>
                <li><strong>Plan your move</strong> — use your equity toward your next Dream Home.</li>
                <li><strong>Agent-backed accuracy</strong> — our estimates combine market data with local expertise.</li>
              </ul>
              <Link to="/financing" className="btn-ghost">Explore Financing Options</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
