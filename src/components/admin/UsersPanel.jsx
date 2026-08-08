import { useState, useEffect } from 'react';
import API_URL from '../../config';

export default function UsersPanel({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const toggleActive = async (u, active) => {
    const d = await fetch(`${API_URL}/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: active ? 1 : 0 }),
    }).then(r => r.json());
    if (d.error) { alert(d.error); return; }
    load();
  };

  const toggleAdmin = async u => {
    await fetch(`${API_URL}/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isAdmin: u.isAdmin ? false : true }),
    });
    load();
  };

  const deleteUser = async u => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    const d = await fetch(`${API_URL}/api/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (d.error) { alert(d.error); return; }
    load();
  };

  const resetPassword = async e => {
    e.preventDefault();
    await fetch(`${API_URL}/api/users/${resetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: resetPw }),
    });
    setResetId(null);
    setResetPw('');
  };

  return (
    <div className="admin-users">
      {resetId && (
        <form className="admin-card admin-form" onSubmit={resetPassword}>
          <h3>Reset password</h3>
          <input required minLength={8} type="password" className="admin-input" placeholder="New password (min 8 chars)" value={resetPw} onChange={e => setResetPw(e.target.value)} />
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn-primary">Set password</button>
            <button type="button" className="admin-btn" onClick={() => { setResetId(null); setResetPw(''); }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="empty-state">Loading users...</p> : (
        <div className="admin-list">
          {users.map(u => {
            const isSelf = currentUser && u.id === currentUser.id;
            return (
              <div className="admin-list-item" key={u.id}>
                <div className="admin-list-main">
                  <div className="admin-list-title">{u.name}{isSelf ? ' (you)' : ''}</div>
                  <div className="admin-list-sub">{u.email} · joined {new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`admin-badge ${u.isAdmin ? 'admin-badge-blue' : ''}`}>{u.isAdmin ? 'Admin' : 'User'}</span>
                <span className={`admin-badge ${u.active ? 'admin-badge-green' : 'admin-badge-red'}`}>{u.active ? 'Active' : 'Disabled'}</span>
                <div className="admin-list-actions">
                  <button className="admin-btn admin-btn-small" onClick={() => toggleAdmin(u)} disabled={isSelf}>{u.isAdmin ? 'Revoke admin' : 'Make admin'}</button>
                  <button className="admin-btn admin-btn-small" onClick={() => setResetId(u.id)}>Reset password</button>
                  <button
                    className={`admin-btn admin-btn-small ${u.active ? 'admin-btn-danger' : ''}`}
                    disabled={isSelf}
                    onClick={() => toggleActive(u, !u.active)}
                  >
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="admin-btn admin-btn-small admin-btn-danger" disabled={isSelf} onClick={() => deleteUser(u)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
