import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';

const programs = [
  { name: 'Conventional Loan', rate: 'From 4.75%', down: '3% min', term: '15–30 years', desc: 'The standard choice for most buyers. Fixed or adjustable rate, best for strong credit scores and 3%+ down payments.' },
  { name: 'FHA Loan', rate: 'From 5.25%', down: '3.5% min', term: '15–30 years', desc: 'Backed by the federal government, FHA loans allow lower credit scores and a low 3.5% down payment. Great for first-time buyers.' },
  { name: 'VA Loan', rate: 'From 4.50%', down: '0%', term: '15–30 years', desc: 'For eligible veterans and active service members. No down payment required and no private mortgage insurance.' },
  { name: 'Jumbo Loan', rate: 'Custom', down: '10–20%', term: '15–30 years', desc: 'For high-value homes above conforming loan limits. Competitive rates with larger down payment requirements.' },
];

export default function Financing() {
  usePageTitle('Financing');
  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="Financing" />
        <div className="info-page">
          <div className="info-hero">
            <span className="info-hero-icon">💰</span>
            <h1>Financing Options</h1>
            <p>From pre-approval to closing, our lending partners help you every step of the way. Get pre-approved today and shop with confidence.</p>
            <div className="info-hero-cta">
              <button className="btn-primary" onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}>Compare Programs</button>
              <Link to="/valuation" className="btn-ghost">Get a Home Valuation</Link>
            </div>
          </div>

          <div className="info-stats-row">
            <div className="info-stat-card"><strong>4.5%</strong><span>Rates starting at</span></div>
            <div className="info-stat-card"><strong>24hrs</strong><span>Typical pre-approval</span></div>
            <div className="info-stat-card"><strong>97%</strong><span>Approval rate*</span></div>
            <div className="info-stat-card"><strong>0</strong><span>Application fees</span></div>
          </div>

          <div id="programs" className="info-section">
            <h2>Loan Programs</h2>
            <div className="financing-grid">
              {programs.map((p) => (
                <div key={p.name} className="financing-card">
                  <h3>{p.name}</h3>
                  <div className="financing-rate">{p.rate}</div>
                  <ul className="financing-list">
                    <li><span>Down payment</span><strong>{p.down}</strong></li>
                    <li><span>Term</span><strong>{p.term}</strong></li>
                  </ul>
                  <p>{p.desc}</p>
                  <button className="btn-ghost">Ask a Lender</button>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h2>How It Works</h2>
            <div className="info-steps">
              <div className="info-step"><span className="info-step-num">1</span><h3>Get Pre-Approved</h3><p>Talk to a lender to determine how much home you can afford and lock in your rate.</p></div>
              <div className="info-step"><span className="info-step-num">2</span><h3>Find Your Home</h3><p>Browse Dream Homes listings with a clear budget in hand and make an offer with confidence.</p></div>
              <div className="info-step"><span className="info-step-num">3</span><h3>Close with Ease</h3><p>We coordinate your inspection, appraisal, and paperwork so closing day is seamless.</p></div>
            </div>
          </div>

          <div className="info-cta">
            <h2>Ready to get started?</h2>
            <p>Talk to a Dream Homes financing specialist today.</p>
            <Link to="/contact" className="btn-primary">Contact Us</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
