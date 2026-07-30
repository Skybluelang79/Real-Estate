import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page Not Found');
  return (
    <section className="section properties-page" style={{ textAlign: 'center', paddingTop: '120px' }}>
      <div className="container">
        <div style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>404</div>
        <h2 style={{ marginTop: '16px' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </section>
  );
}
