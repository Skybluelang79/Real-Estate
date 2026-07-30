import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeImage from '../components/SafeImage';
import Breadcrumbs from '../components/Breadcrumbs';
import API_URL from '../config';
import usePageTitle from '../hooks/usePageTitle';

export default function Profile() {
  const { user, token } = useAuth();
  usePageTitle(user ? `Profile - ${user.name}` : 'Profile');
  const navigate = useNavigate();
  const [tab, setTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [tours, setTours] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    if (!user) navigate('/signin');
  }, [user, navigate]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setFavorites(d.favorites || [])).catch(() => {});
    fetch(`${API_URL}/api/tours/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTours(d.tours || [])).catch(() => {});
    fetch(`${API_URL}/api/saved-searches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setSavedSearches(d.savedSearches || [])).catch(() => {});
  }, [token]);

  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="My Profile" />
        <div className="profile-header-card">
          <div className="profile-avatar-lg">{initials}</div>
          <div className="profile-info-lg">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            {user.isAdmin && <span className="admin-role-badge">Administrator</span>}
          </div>
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat-card"><div className="profile-stat-num">{favorites.length}</div><div className="profile-stat-label">Favorites</div></div>
          <div className="profile-stat-card"><div className="profile-stat-num">{tours.length}</div><div className="profile-stat-label">Tours</div></div>
          <div className="profile-stat-card"><div className="profile-stat-num">{savedSearches.length}</div><div className="profile-stat-label">Saved Searches</div></div>
        </div>

        <div className="admin-tabs" style={{ marginTop: '32px' }}>
          {['favorites', 'tours', 'searches'].map(t => (
            <button key={t} className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`} onClick={() => setTab(t)}>
              {t === 'favorites' ? 'Favorites' : t === 'tours' ? 'My Tours' : 'Saved Searches'}
            </button>
          ))}
        </div>

        {tab === 'favorites' && (
          <div className="admin-tab-content admin-tab-visible">
            {favorites.length === 0 ? (
              <div className="admin-empty-state">
                <p>No favorites yet.</p>
                <Link to="/properties" className="btn-primary">Browse Properties</Link>
              </div>
            ) : (
              <div className="property-grid">
                {favorites.map(f => (
                  <Link key={f.id} to={`/property/${f.propertyId}`} className="similar-card">
                    <SafeImage src={f.image} alt={f.title} />
                    <div className="similar-card-body">
                      <strong>${(f.price || 0).toLocaleString()}</strong>
                      <span>{f.title}</span>
                      <span>{f.beds} beds · {f.baths} baths · {f.sqft} sqft</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'tours' && (
          <div className="admin-tab-content admin-tab-visible">
            {tours.length === 0 ? (
              <div className="admin-empty-state"><p>No tours scheduled yet.</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Property</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {tours.map(t => (
                      <tr key={t.id} className="admin-table-row">
                        <td><strong>{t.propertyTitle || `Property #${t.propertyId}`}</strong></td>
                        <td>{t.preferredDate || '-'}</td>
                        <td>{t.preferredTime || '-'}</td>
                        <td><span className={`admin-status-badge admin-status-${t.status || 'pending'}`}>{t.status || 'pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'searches' && (
          <div className="admin-tab-content admin-tab-visible">
            {savedSearches.length === 0 ? (
              <div className="admin-empty-state"><p>No saved searches yet.</p></div>
            ) : (
              <div className="saved-searches-list">
                {savedSearches.map((s, i) => (
                  <div key={s.id || i} className="saved-search-card">
                    <div><strong>{s.name || `Search ${i + 1}`}</strong><span className="admin-sub-text">{s.filters ? JSON.stringify(s.filters) : '—'}</span></div>
                    <Link to={`/properties${s.filters?.search ? `?search=${encodeURIComponent(s.filters.search)}` : ''}`} className="btn-ghost">Run</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
