import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';

const services = [
  { name: 'Local Movers', desc: 'Licensed and insured moving crews available in your area with transparent flat-rate pricing.', icon: '🚚' },
  { name: 'Packing Supplies', desc: 'Get boxes, tape, and packing materials delivered straight to your door.', icon: '📦' },
  { name: 'Utility Setup', desc: 'We help transfer electricity, gas, internet, and water to your new address.', icon: '💡' },
  { name: 'Cleaning Services', desc: 'Move-in or move-out deep cleaning to make your transition spotless.', icon: '🧽' },
  { name: 'Storage Units', desc: 'Short or long-term storage solutions with climate-controlled options.', icon: 'ðŸ¬' },
  { name: 'Insurance Coverage', desc: 'Protect your belongings during transit with affordable moving insurance.', icon: 'ðŸ›¡ï¸' },
];

export default function Moving() {
  usePageTitle('Moving Services');
  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="Moving Services" />
        <div className="info-page">
          <div className="info-hero">
            <span className="info-hero-icon">📦</span>
            <h1>Moving Services</h1>
            <p>Relocating can be stressful — we make it simple. Our trusted moving partners handle every detail so you can focus on settling into your new home.</p>
            <div className="info-hero-cta">
              <button className="btn-primary" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>See Services</button>
              <Link to="/contact" className="btn-ghost">Get a Quote</Link>
            </div>
          </div>

          <div className="info-stats-row">
            <div className="info-stat-card"><strong>500+</strong><span>Moves completed</span></div>
            <div className="info-stat-card"><strong>4.9★</strong><span>Average rating</span></div>
            <div className="info-stat-card"><strong>48hrs</strong><span>Quote turnaround</span></div>
            <div className="info-stat-card"><strong>100%</strong><span>Insured partners</span></div>
          </div>

          <div id="services" className="info-section">
            <h2>What We Offer</h2>
            <div className="moving-grid">
              {services.map((s) => (
                <div key={s.name} className="moving-card">
                  <span className="moving-icon">{s.icon}</span>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="info-cta">
            <h2>Exclusive 20% discount for Dream Homes clients</h2>
            <p>Use code DREAMHOMES20 when booking any participating moving partner.</p>
            <Link to="/contact" className="btn-primary">Get Your Moving Quote</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
