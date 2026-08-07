import { useState, useEffect } from 'react';
import API_URL from '../../config';

export default function DashboardPanel({ token, properties }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const paths = ['/api/leads', '/api/notifications', '/api/open-houses/all', '/api/tours', '/api/offers', '/api/contacts', '/api/pre-qualifications', '/api/newsletter', '/api/analytics/stats'];
    Promise.all(paths.map(p => fetch(`${API_URL}${p}`, { headers }).then(r => r.json()).catch(() => ({}))))
      .then(([leads, notifications, openHouses, tours, offers, contacts, prequals, newsletter, stats]) => {
        setData({ leads, notifications, openHouses, tours, offers, contacts, prequals, newsletter, stats });
      });
  }, [token]);

  if (!data) return <p className="empty-state">Loading dashboard...</p>;

  const totalListings = (properties || []).length;
  const activeListings = (properties || []).filter(p => p.status !== 'Sold').length;
  const newLeads = (data.leads.leads || []).length;
  const pendingTours = (data.tours.tours || []).filter(t => t.status === 'pending').length;
  const pendingOffers = (data.offers.offers || []).filter(o => o.status === 'pending').length;
  const totalValue = (properties || []).filter(p => p.status !== 'Sold').reduce((a, p) => a + (p.price || 0), 0);
  const avgPrice = activeListings > 0 ? Math.round(totalValue / activeListings) : 0;
  const unread = (data.notifications.notifications || []).filter(n => !n.read).length;
  const upcomingOh = (data.openHouses.openHouses || []).filter(o => new Date(o.date) >= new Date(Date.now() - 86400000)).length;
  const kpis = [
    { label: 'Active Listings', value: activeListings, sub: `${totalListings} total` },
    { label: 'Portfolio Value', value: '$' + Math.round(totalValue / 1e6).toLocaleString() + 'M', sub: 'non-sold inventory' },
    { label: 'Avg. Price', value: '$' + Math.round(avgPrice / 1000).toLocaleString() + 'K', sub: 'per active listing' },
    { label: 'New Leads', value: newLeads, sub: 'all sources' },
    { label: 'Pending Tours', value: pendingTours, sub: `${(data.tours.tours || []).length} total` },
    { label: 'Pending Offers', value: pendingOffers, sub: `${(data.offers.offers || []).length} total` },
    { label: 'Upcoming Open Houses', value: upcomingOh, sub: `${(data.openHouses.openHouses || []).length} scheduled` },
    { label: 'Unread Notifications', value: unread, sub: 'needs attention' },
  ];

  const topProps = (data.stats.topProperties || []).slice(0, 8);
  const maxViews = topProps.length > 0 ? Math.max(...topProps.map(p => p.views)) : 1;
  const feed = (data.notifications.notifications || []).slice(0, 10);

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-row admin-kpi-row">
        {kpis.map(k => (
          <div className="admin-stat-card" key={k.label}>
            <div className="admin-stat-number">{k.value}</div>
            <div className="admin-stat-label">{k.label}</div>
            <div className="admin-stat-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="admin-card">
          <h3>Most Viewed Properties</h3>
          {topProps.length === 0 ? (
            <p className="admin-empty">No view data yet.</p>
          ) : (
            <div className="dash-bars">
              {topProps.map(p => (
                <div className="dash-bar-row" key={p.id}>
                  <span className="dash-bar-label">{p.title || p.name}</span>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }} />
                  </div>
                  <span className="dash-bar-value">{p.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h3>Recent Activity</h3>
          {feed.length === 0 ? (
            <p className="admin-empty">No activity yet.</p>
          ) : (
            <div className="dash-feed">
              {feed.map(n => (
                <div className={`dash-feed-item ${!n.read ? 'dash-feed-unread' : ''}`} key={n.id}>
                  <span className={`dash-feed-dot dash-dot-${n.type || 'info'}`} />
                  <div>
                    <p className="dash-feed-msg">{n.message}</p>
                    <span className="dash-feed-time">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="admin-card">
          <h3>Pipeline Summary</h3>
          <div className="dash-pipeline">
            {['new', 'contacted', 'toured', 'offer', 'closed'].map(s => {
              const c = (data.leads.leads || []).filter(l => (l.status || 'new') === s).length;
              return (
                <div className="dash-pipe-row" key={s}>
                  <span className="dash-pipe-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  <div className="dash-bar-track"><div className="dash-bar-fill dash-fill-pipe" style={{ width: `${(c / Math.max(newLeads, 1)) * 100}%` }} /></div>
                  <span className="dash-bar-value">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-card">
          <h3>Sources</h3>
          <div className="dash-sources">
            {['contact', 'tour', 'offer', 'prequal', 'open-house', 'newsletter', 'manual'].map(s => {
              const c = (data.leads.leads || []).filter(l => (l.source || '') === s).length;
              return (
                <div className="dash-source-row" key={s}>
                  <span>{s.replace('-', ' ').replace(/\b\w/g, x => x.toUpperCase())}</span>
                  <strong>{c}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
