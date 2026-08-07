import { useState, useEffect } from 'react';
import API_URL from '../../config';

const STAGES = ['new', 'contacted', 'toured', 'offer', 'closed'];
const STAGE_LABELS = { new: 'New', contacted: 'Contacted', toured: 'Toured', offer: 'Offer', closed: 'Closed' };

export default function LeadPipelinePanel({ token, agents }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newLead, setNewLead] = useState(null);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/leads`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const moveLead = async (id, status) => {
    const prev = leads;
    setLeads(leads.map(l => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`${API_URL}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    } catch {
      setLeads(prev);
    }
  };

  const createLead = async e => {
    e.preventDefault();
    await fetch(`${API_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newLead, source: 'manual' }),
    });
    setNewLead(null);
    load();
  };

  const updateLead = async e => {
    e.preventDefault();
    if (!selected) return;
    await fetch(`${API_URL}/api/leads/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        status: selected.status,
        type: selected.type,
        agent: selected.agent,
        budget: selected.budget,
        notes: selected.notes,
      }),
    });
    setSelected(null);
    load();
  };

  const deleteLead = async id => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`${API_URL}/api/leads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (selected && selected.id === id) setSelected(null);
    load();
  };

  const filtered = leads.filter(l => !filter || (l.name || '').toLowerCase().includes(filter.toLowerCase()) || (l.email || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="admin-leads">
      <div className="admin-panel-toolbar">
        <input className="admin-input admin-search-input" placeholder="Search leads..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button className="admin-btn admin-btn-primary" onClick={() => setNewLead({ name: '', email: '', phone: '', type: 'buyer', status: 'new', source: 'manual', agent: '', budget: '' })}>
          + Add Lead
        </button>
      </div>

      {newLead && (
        <form className="admin-card admin-form" onSubmit={createLead}>
          <h3>New Lead</h3>
          <div className="admin-form-grid">
            <input required placeholder="Name" className="admin-input" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
            <input required type="email" placeholder="Email" className="admin-input" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
            <input placeholder="Phone" className="admin-input" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
            <select className="admin-input" value={newLead.type} onChange={e => setNewLead({ ...newLead, type: e.target.value })}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="investor">Investor</option>
            </select>
            <select className="admin-input" value={newLead.agent || ''} onChange={e => setNewLead({ ...newLead, agent: e.target.value })}>
              <option value="">Unassigned</option>
              {(agents || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input placeholder="Budget" className="admin-input" value={newLead.budget} onChange={e => setNewLead({ ...newLead, budget: e.target.value })} />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn-primary">Create</button>
            <button type="button" className="admin-btn" onClick={() => setNewLead(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-state">Loading leads...</p>
      ) : (
        <div className="kanban-board">
          {STAGES.map(stage => {
            const cols = filtered.filter(l => (l.status || 'new') === stage);
            return (
              <div className="kanban-col" key={stage}>
                <div className="kanban-col-head">
                  <span className={`kanban-dot dot-${stage}`} />
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="kanban-count">{cols.length}</span>
                </div>
                <div className="kanban-cards">
                  {cols.map(l => (
                    <div className="kanban-card" key={l.id} onClick={() => setSelected(l)}>
                      <div className="kanban-card-name">{l.name || l.email}</div>
                      <div className="kanban-card-sub">
                        <span className={`lead-type-badge lead-type-${l.type || 'buyer'}`}>{l.type || 'buyer'}</span>
                        {l.budget ? <span className="kanban-card-budget">${Number(l.budget).toLocaleString()}</span> : null}
                      </div>
                      <div className="kanban-card-meta">
                        {l.source ? <span>{l.source}</span> : null}
                        <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && <div className="kanban-drop-hint">Drop here</div>}
                </div>
                <div className="kanban-move-row">
                  {stage !== 'new' && <button className="kanban-move kanban-move-left" title="Move back" onClick={() => cols[0] && moveLead(cols[0].id, STAGES[STAGES.indexOf(stage) - 1])}>◀</button>}
                  {stage !== 'closed' && <button className="kanban-move kanban-move-right" title="Move forward" onClick={() => cols[0] && moveLead(cols[0].id, STAGES[STAGES.indexOf(stage) + 1])}>▶</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="admin-modal" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <form className="admin-card lead-modal" onSubmit={updateLead}>
            <button type="button" className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h3>{selected.name || selected.email}</h3>
            <div className="lead-modal-info">
              <span>Email: {selected.email}</span>
              {selected.phone && <span>Phone: {selected.phone}</span>}
              <span>Source: {selected.source || '—'}</span>
              <span>Created: {new Date(selected.createdAt).toLocaleString()}</span>
            </div>
            <div className="admin-form-grid">
              <label>
                Stage
                <select className="admin-input" value={selected.status} onChange={e => setSelected({ ...selected, status: e.target.value })}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </label>
              <label>
                Type
                <select className="admin-input" value={selected.type || 'buyer'} onChange={e => setSelected({ ...selected, type: e.target.value })}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="investor">Investor</option>
                </select>
              </label>
              <label>
                Agent
                <select className="admin-input" value={selected.agent || ''} onChange={e => setSelected({ ...selected, agent: e.target.value })}>
                  <option value="">Unassigned</option>
                  {(agents || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>
                Budget
                <input className="admin-input" value={selected.budget || ''} onChange={e => setSelected({ ...selected, budget: e.target.value })} />
              </label>
            </div>
            <label>
              Notes
              <textarea className="admin-input" rows={3} value={selected.notes || ''} onChange={e => setSelected({ ...selected, notes: e.target.value })} />
            </label>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">Save</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteLead(selected.id)}>Delete</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
