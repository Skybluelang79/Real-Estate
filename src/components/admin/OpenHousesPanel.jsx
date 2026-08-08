import { useState, useEffect } from 'react';
import API_URL from '../../config';

export default function OpenHousesPanel({ token, properties }) {
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rsvpsFor, setRsvpsFor] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/open-houses/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOpenHouses(d.openHouses || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const openForm = oh => {
    setEditing(oh || null);
    setForm(oh || { propertyId: '', date: '', startTime: '', endTime: '', description: '' });
    setShowForm(true);
  };

  const save = async e => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/api/open-houses/${editing.id}` : `${API_URL}/api/open-houses`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setEditing(null);
    load();
  };

  const remove = async oh => {
    if (!confirm(`Delete open house on ${oh.date}?`)) return;
    await fetch(`${API_URL}/api/open-houses/${oh.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const showRsvps = async oh => {
    setRsvpsFor(oh);
    const d = await fetch(`${API_URL}/api/open-houses/${oh.id}/rsvps`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    setRsvps(d.rsvps || []);
  };

  const sorted = [...openHouses].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = sorted.filter(o => new Date(o.date) >= new Date(Date.now() - 86400000));
  const past = sorted.filter(o => new Date(o.date) < new Date(Date.now() - 86400000));

  const propTitle = id => {
    const p = (properties || []).find(x => x.id === Number(id));
    return p ? p.title : (id || '—');
  };

  return (
    <div className="admin-oh">
      <div className="admin-panel-toolbar">
        <span className="admin-toolbar-info">{sorted.length} open houses</span>
        <button className="admin-btn admin-btn-primary" onClick={() => openForm(null)}>+ Schedule Open House</button>
      </div>

      {showForm && (
        <form className="admin-card admin-form" onSubmit={save}>
          <h3>{editing ? 'Edit Open House' : 'Schedule Open House'}</h3>
          <div className="admin-form-grid">
            <label>
              Date
              <input type="date" required className="admin-input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
            </label>
            <label>
              Start Time
              <input type="time" required className="admin-input" value={form.startTime || ''} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </label>
            <label>
              End Time
              <input type="time" required className="admin-input" value={form.endTime || ''} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </label>
            <label>
              Property
              <select required className="admin-input" value={form.propertyId || ''} onChange={e => setForm({ ...form, propertyId: e.target.value })}>
                <option value="">Select property</option>
                {(properties || []).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label>
              Description
              <input className="admin-input" placeholder="Optional description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn-primary">Save</button>
            <button type="button" className="admin-btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="empty-state">Loading...</p> : null}

      {upcoming.length > 0 && (
        <>
          <h3 className="admin-section-title">Upcoming</h3>
          <div className="admin-list">
            {upcoming.map(o => (
              <div className="admin-list-item" key={o.id}>
                <div className="admin-list-main">
                  <div className="admin-list-title">{o.propertyTitle || propTitle(o.propertyId)}</div>
                  <div className="admin-list-sub">
                    {new Date(o.date).toLocaleDateString()} · {o.startTime}–{o.endTime}
                    {o.description ? ` · ${o.description}` : ''}
                  </div>
                </div>
                <span className="admin-badge">{o.rsvpCount || 0} RSVPs</span>
                <div className="admin-list-actions">
                  <button className="admin-btn admin-btn-small" onClick={() => showRsvps(o)}>RSVPs</button>
                  <button className="admin-btn admin-btn-small" onClick={() => openForm(o)}>Edit</button>
                  <button className="admin-btn admin-btn-small admin-btn-danger" onClick={() => remove(o)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h3 className="admin-section-title">Past</h3>
          <div className="admin-list">
            {past.map(o => (
              <div className="admin-list-item" key={o.id}>
                <div className="admin-list-main">
                  <div className="admin-list-title">{o.propertyTitle || propTitle(o.propertyId)}</div>
                  <div className="admin-list-sub">{new Date(o.date).toLocaleDateString()} · {o.startTime}–{o.endTime}</div>
                </div>
                <span className="admin-badge">{o.rsvpCount || 0} RSVPs</span>
                <div className="admin-list-actions">
                  <button className="admin-btn admin-btn-small" onClick={() => showRsvps(o)}>RSVPs</button>
                  <button className="admin-btn admin-btn-small admin-btn-danger" onClick={() => remove(o)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && sorted.length === 0 && <p className="admin-empty">No open houses scheduled yet.</p>}

      {rsvpsFor && (
        <div className="admin-modal" onClick={e => e.target === e.currentTarget && setRsvpsFor(null)}>
          <div className="admin-card lead-modal">
            <button type="button" className="modal-close" onClick={() => setRsvpsFor(null)}>×</button>
            <h3>RSVPs — {new Date(rsvpsFor.date).toLocaleDateString()}</h3>
            {rsvps.length === 0 ? (
              <p className="admin-empty">No RSVPs yet.</p>
            ) : (
              <div className="admin-list">
                {rsvps.map((r, i) => (
                  <div className="admin-list-item" key={i}>
                    <div className="admin-list-main">
                      <div className="admin-list-title">{r.name}</div>
                      <div className="admin-list-sub">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                    </div>
                    <span className="admin-badge">{r.guests || 1} attending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
