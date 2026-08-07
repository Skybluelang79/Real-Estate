import { Link } from 'react-router';
import neighborhoods from '../data/neighborhoods';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import SafeImage from '../components/SafeImage';

export default function Neighborhoods() {
  return (
    <section className="section neighborhoods-page">
      <Seo
        title="Neighborhood Guides"
        description="Explore detailed guides to Los Angeles' most desirable neighborhoods — schools, commute, walk scores and featured homes."
        path="/neighborhoods"
      />
      <div className="container">
        <Breadcrumbs current="Neighborhoods" />
        <div className="page-header">
          <h1>Neighborhood Guides</h1>
          <p>Live where you love — explore our curated guides to the region's most desirable communities</p>
        </div>
        <div className="neighborhood-grid">
          {neighborhoods.map((n) => (
            <Link to={`/neighborhoods/${n.slug}`} key={n.slug} className="neighborhood-card">
              <div className="neighborhood-image-wrap">
                <SafeImage src={n.image} alt={n.name} className="neighborhood-image" />
                <div className="neighborhood-overlay" />
                <div className="neighborhood-card-body">
                  <h3>{n.name}</h3>
                  <p>{n.tagline}</p>
                  <span className="neighborhood-cta">Explore <span aria-hidden>→</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
