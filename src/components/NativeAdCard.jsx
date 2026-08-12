import { Link } from 'react-router';

export default function NativeAdCard({ ad }) {
  const inner = (
    <div className="native-ad-card">
      {ad.image && <div className="native-ad-media" style={{ backgroundImage: `url(${ad.image})` }} />}
      <div className="native-ad-body">
        <span className="ad-badge-sm">Sponsored</span>
        <h4>{ad.title}</h4>
        <p>{ad.description}</p>
        <span className="native-ad-cta">{ad.cta || 'Learn More'} →</span>
      </div>
    </div>
  );
  if (ad.link && ad.link.startsWith('/')) {
    return <Link to={ad.link} className="native-ad-link">{inner}</Link>;
  }
  return <a href={ad.link || '#'} className="native-ad-link" target="_blank" rel="noopener noreferrer">{inner}</a>;
}
