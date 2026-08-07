import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import PropertyCard from '../components/PropertyCard';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import SafeImage from '../components/SafeImage';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function AgentDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [agent, setAgent] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/agents/${id}`)
      .then(r => r.json())
      .then(data => {
        setAgent(data.agent || null);
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setAgent(null); });
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: `${form.message}\n\n(re: ${agent?.name || 'Dream Homes agent'})`,
        }),
      });
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <section className="section properties-page">
        <div className="container">
          <div className="skeleton-detail"><div className="skeleton-line skeleton-lg" /><div className="skeleton-line skeleton-md" /></div>
        </div>
      </section>
    );
  }

  if (!agent) {
    return (
      <section className="section properties-page" style={{ textAlign: 'center', paddingTop: '160px' }}>
        <h2>Agent Not Found</h2>
        <Link to="/agents" className="btn-primary" style={{ marginTop: 20 }}>{t('agents.title')}</Link>
      </section>
    );
  }

  const specialties = agent.specialties ? agent.specialties.split(',').map(s => s.trim()) : [];

  return (
    <section className="section agent-detail-page">
      <Seo
        title={`${agent.name} — Dream Homes Agent`}
        description={`${agent.name} · ${agent.title || 'Real Estate Advisor'}. ${agent.experience || ''} experience, ${agent.sales || ''}. View their featured listings at Dream Homes.`}
        image={agent.photo || undefined}
        path={`/agents/${agent.id}`}
      />
      <div className="container">
        <Breadcrumbs current={agent.name} />
        <div className="agent-detail-hero">
          <div className="agent-detail-photo">
            {agent.photo ? <SafeImage src={agent.photo} alt={agent.name} /> : <div className="agent-avatar agent-avatar-lg">{agent.name?.charAt(0) || 'A'}</div>}
          </div>
          <div className="agent-detail-info">
            <span className="agent-detail-title">{agent.title || 'Real Estate Advisor'}</span>
            <h1>{agent.name}</h1>
            <div className="agent-detail-stats">
              <div><strong>{agent.experience || '—'}</strong><span>Experience</span></div>
              <div><strong>{agent.sales || '—'}</strong><span>Track Record</span></div>
              <div><strong>{listings.length}</strong><span>Active Listings</span></div>
            </div>
            <p className="agent-detail-bio">{agent.bio}</p>
            <div className="agent-detail-contact">
              <a href={`mailto:${agent.email}`} className="btn-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
                Email Agent
              </a>
              {agent.phone && <span className="agent-detail-phone">{agent.phone}</span>}
            </div>
            {specialties.length > 0 && (
              <div className="agent-detail-specialties">
                {specialties.map((s, i) => <span key={i} className="property-tag">{s}</span>)}
              </div>
            )}
          </div>
        </div>

        {listings.length > 0 && (
          <div className="agent-detail-section">
            <h2>Featured Listings</h2>
            <div className="property-grid">
              {listings.map((p) => <PropertyCard key={p.id || p._id} property={p} />)}
            </div>
          </div>
        )}

        <div className="agent-detail-section agent-contact-form">
          <h2>Work With {agent.name.split(' ')[0]}</h2>
          {sent && <p className="form-status-msg">Message sent! {agent.name.split(' ')[0]} will get back to you shortly.</p>}
          <form onSubmit={submit} className="tour-form">
            <div className="form-row-2">
              <input type="text" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input type="email" placeholder="Your Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <textarea rows={3} placeholder="Tell us what you're looking for..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
