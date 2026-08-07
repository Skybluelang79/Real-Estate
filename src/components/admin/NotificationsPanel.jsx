import { useState, useEffect } from 'react';
import API_URL from '../../config';

export default function NotificationsPanel({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const markRead = async id => {
    setNotifications(notifications.map(n => (n.id === id ? { ...n, read: 1 } : n)));
    await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  };

  const markAll = async () => {
    await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(notifications.map(n => ({ ...n, read: 1 })));
  };

  const filtered = typeFilter ? notifications.filter(n => n.type === typeFilter) : notifications;
  const unread = notifications.filter(n => !n.read).length;
  const types = [...new Set(notifications.map(n => n.type))];

  return (
    <div className="admin-notifications">
      <div className="admin-panel-toolbar">
        <span className="admin-toolbar-info">{unread} unread of {notifications.length}</span>
        <div className="admin-toolbar-actions">
          <select className="admin-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="admin-btn admin-btn-small" onClick={markAll} disabled={unread === 0}>Mark all read</button>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Loading notifications...</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No notifications yet.</p>
      ) : (
        <div className="admin-list">
          {filtered.map(n => (
            <div className={`admin-list-item ${!n.read ? 'notif-unread' : ''}`} key={n.id} onClick={() => !n.read && markRead(n.id)}>
              <span className={`dash-feed-dot dash-dot-${n.type || 'info'}`} />
              <div className="admin-list-main">
                <div className="admin-list-title">{n.message}</div>
                <div className="admin-list-sub">
                  {n.type} · {new Date(n.createdAt).toLocaleString()}
                  {n.link ? <a className="notif-link" href={n.link}> · view</a> : null}
                </div>
              </div>
              {!n.read && <span className="admin-badge admin-badge-blue">New</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
