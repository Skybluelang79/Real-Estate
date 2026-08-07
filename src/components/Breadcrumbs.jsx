import { Link, useLocation } from 'react-router';

const LABELS = {
  properties: 'Properties',
  about: 'About',
  contact: 'Contact',
  map: 'Map View',
  signin: 'Sign In',
  signup: 'Sign Up',
  profile: 'Profile',
  admin: 'Admin',
};

export default function Breadcrumbs({ current }) {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-link">Home</Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        const label = current && isLast ? current : LABELS[part] || part.replace(/-/g, ' ');
        return (
          <span key={path} className="breadcrumb-item">
            <span className="breadcrumb-sep">/</span>
            {isLast ? <span className="breadcrumb-current">{label}</span> : <Link to={path} className="breadcrumb-link">{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
