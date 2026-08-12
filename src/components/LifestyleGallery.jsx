import { Link } from 'react-router';

const SHOTS = [
  { label: 'Luxury Estates', sub: 'Beverly Hills', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000', to: '/properties' },
  { label: 'Penthouse Living', sub: 'Downtown LA', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000', to: '/properties' },
  { label: 'Modern Architecture', sub: 'West Hollywood', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000', to: '/properties' },
  { label: 'Coastal Retreats', sub: 'Malibu', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000', to: '/properties' },
  { label: 'Designer Interiors', sub: 'The Collection', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000', to: '/properties' },
  { label: 'Private Collections', sub: 'By Invitation', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000', to: '/private' },
];

export default function LifestyleGallery() {
  return (
    <section className="section lifestyle-gallery-section">
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <span className="section-kicker">The Dream Homes Journal</span>
            <h2>Curated Spaces, Inspired Living</h2>
            <p>Follow our journey through Los Angeles' most extraordinary residences.</p>
          </div>
          <div className="section-header-actions">
            <Link to="/properties" className="btn-ghost btn-sm">Browse All →</Link>
          </div>
        </div>
        <div className="lifestyle-grid">
          {SHOTS.map((s) => (
            <Link key={s.label} to={s.to} className="lifestyle-tile" style={{ backgroundImage: `url(${s.image})` }}>
              <span className="lifestyle-caption">
                <span className="lifestyle-label">{s.label}</span>
                <span className="lifestyle-sub">{s.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
