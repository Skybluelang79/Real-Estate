import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthCtx';
import SafeImage from '../components/SafeImage';
import Breadcrumbs from '../components/Breadcrumbs';
import API_URL from '../config';
import usePageTitle from '../hooks/usePageTitle';
import DashboardPanel from '../components/admin/DashboardPanel';
import LeadPipelinePanel from '../components/admin/LeadPipelinePanel';
import OpenHousesPanel from '../components/admin/OpenHousesPanel';
import NotificationsPanel from '../components/admin/NotificationsPanel';
import UsersPanel from '../components/admin/UsersPanel';

function AnimatedNum({ end, duration = 1500 }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

function AnalyticsPanel({ token }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API_URL}/api/analytics/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, [token]);
  if (!stats) return <p>Loading analytics...</p>;
  return (
    <div className="analytics-dashboard">
      <div className="admin-stats-row">
        <div className="admin-stat-card"><div className="admin-stat-number">{stats.totalViews}</div><div className="admin-stat-label">Total Views</div></div>
        <div className="admin-stat-card"><div className="admin-stat-number">{stats.totalInquiries}</div><div className="admin-stat-label">Inquiries</div></div>
      </div>
      {stats.topProperties?.length > 0 && (
        <>
          <h3>Top Properties</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Property</th><th>Views</th></tr></thead>
              <tbody>
                {stats.topProperties.map(p => (
                  <tr key={p.id} className="admin-table-row">
                    <td>{p.title || p.name}</td>
                    <td>{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function TestimonialsPanel({ token }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', role: '', content: '', rating: 5, active: true });
  const [editing, setEditing] = useState(null);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = () => {
    fetch(`${API_URL}/api/testimonials/admin`, { headers })
      .then(r => r.json()).then(d => setList(d.testimonials || [])).catch(() => {});
  };
  useEffect(load, [token, headers]);

  const save = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/api/testimonials/${editing}` : `${API_URL}/api/testimonials`;
    const body = { ...form, active: form.active !== undefined ? form.active : true };
    const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (res.ok) { setForm({ name: '', role: '', content: '', rating: 5, active: true }); setEditing(null); load(); }
  };

  const toggleActive = async (id, active) => {
    const t = list.find(x => x.id === id);
    if (!t) return;
    const res = await fetch(`${API_URL}/api/testimonials/${id}`, { method: 'PUT', headers, body: JSON.stringify({ ...t, active: !active }) });
    if (res.ok) load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    await fetch(`${API_URL}/api/testimonials/${id}`, { method: 'DELETE', headers });
    load();
  };

  return (
    <div>
      <form className="admin-form" onSubmit={save} style={{ marginBottom: 24 }}>
        <div className="form-row-2">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label>Role</label><input value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
        </div>
        <div className="form-group"><label>Content</label><textarea rows={2} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
        <div className="form-row-2">
          <div className="form-group"><label>Rating (1-5)</label><input type="number" min={1} max={5} value={form.rating} onChange={e => setForm({...form, rating: parseInt(e.target.value) || 5})} /></div>
          <div className="form-group" style={{ alignSelf: 'flex-end', display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({...form, active: e.target.checked})} /> Active</label>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Testimonial'}</button>
            {editing && <button type="button" className="btn-ghost" onClick={() => { setForm({ name: '', role: '', content: '', rating: 5, active: true }); setEditing(null); }} style={{ marginLeft: 8 }}>Cancel</button>}
          </div>
        </div>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Content</th><th>Rating</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {list.map(t => (
              <tr key={t.id} className="admin-table-row">
                <td><strong>{t.name}</strong><br /><span className="admin-sub-text">{t.role}</span></td>
                <td className="admin-msg-cell">{(t.content || '').substring(0, 100)}</td>
                <td>{'★'.repeat(t.rating)}{'★'.repeat(5 - t.rating)}</td>
                <td>
                  <button className={`admin-status-badge admin-status-${t.active ? 'scheduled' : 'pending'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => toggleActive(t.id, !!t.active)} title="Click to toggle">
                    {t.active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <button className="admin-btn-edit" onClick={() => { setEditing(t.id); setForm({ name: t.name, role: t.role || '', content: t.content, rating: t.rating, active: !!t.active }); }}>Edit</button>
                  <button className="admin-btn-delete" onClick={() => remove(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlogPanel({ token }) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', image: '', author: '', tags: '', published: true });
  const [editing, setEditing] = useState(null);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const load = () => {
    fetch(`${API_URL}/api/blog/admin`, { headers })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  };
  useEffect(load, [token, headers]);

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/api/blog/${editing}` : `${API_URL}/api/blog`;
    const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (res.ok) { setForm({ title: '', slug: '', content: '', excerpt: '', image: '', author: '', tags: '', published: true }); setEditing(null); load(); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API_URL}/api/blog/${id}`, { method: 'DELETE', headers });
    load();
  };

  const togglePublished = async (id, published) => {
    const res = await fetch(`${API_URL}/api/blog/${id}`, { method: 'PUT', headers, body: JSON.stringify({ published: !published }) });
    if (res.ok) load();
  };

  return (
    <div>
      <form className="admin-form" onSubmit={save} style={{ marginBottom: 24 }}>
        <div className="form-row-2">
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
          <div className="form-group"><label>Slug</label><input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="my-post-slug" /></div>
        </div>
        <div className="form-group"><label>Content</label><textarea rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
        <div className="form-row-2">
          <div className="form-group"><label>Excerpt</label><input value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} /></div>
          <div className="form-group"><label>Image URL</label><input value={form.image} onChange={e => setForm({...form, image: e.target.value})} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-group"><label>Author</label><input value={form.author} onChange={e => setForm({...form, author: e.target.value})} /></div>
          <div className="form-group"><label>Tags (comma-separated)</label><input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} /></div>
        </div>
        <div className="form-group">
          <label><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} /> Published</label>
        </div>
        <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create Post'}</button>
        {editing && <button type="button" className="btn-ghost" onClick={() => { setForm({ title: '', slug: '', content: '', excerpt: '', image: '', author: '', tags: '', published: true }); setEditing(null); }} style={{ marginLeft: 8 }}>Cancel</button>}
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="admin-table-row">
                <td><strong>{p.title}</strong></td>
                <td>{p.author || 'Admin'}</td>
                <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <button className={`admin-status-badge admin-status-${p.published ? 'scheduled' : 'pending'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => togglePublished(p.id, !!p.published)} title="Click to toggle">
                    {p.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td>
                  <button className="admin-btn-edit" onClick={() => {
                    setEditing(p.id);
                    setForm({ title: p.title, slug: p.slug || '', content: p.content, excerpt: p.excerpt || '', image: p.image || '', author: p.author || '', tags: (p.tags || []).join(', '), published: !!p.published });
                  }}>Edit</button>
                  <button className="admin-btn-delete" onClick={() => remove(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatPanel({ token }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/chat/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/chat/messages`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [token]);
  return (
    <div className="admin-chat-panel">
      <div className="admin-chat-messages">
        {messages.length === 0 && <p className="admin-empty">No messages yet.</p>}
        {messages.map(m => (
          <div key={m.id} className="admin-chat-msg">
            <strong>{m.userName || 'Guest'}</strong>
            <span className="admin-sub-text">{new Date(m.createdAt).toLocaleString()}</span>
            <p>{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, token, loading } = useAuth();
  usePageTitle('Admin Dashboard');
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tours, setTours] = useState([]);
  const [offers, setOffers] = useState([]);
  const [prequals, setPrequals] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [toast, setToast] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', address: '', city: '', state: '', zip: '', country: 'US',
    price: '', beds: '', baths: '', sqft: '', type: 'House',
    yearBuilt: '', description: '', agent: '', agentPhone: '', agentEmail: '',
    tags: '', image: '', images: '', video: '', floorPlan: '', isPrivate: 0, badge: 'New', featured: false, latitude: '', longitude: '',
    lotSize: '', hoa: '', propertyTaxes: '', garage: '', stories: '', cooling: '', heating: '', parking: '', roof: '', viewType: '', basement: '',
    amenities: '', floorPlans: '', availability: 'Available Now', retail: '', status: 'For Sale'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.isAdmin) navigate('/');
  }, [user, navigate, loading]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/properties?limit=1000`).then(r => r.json()).then(d => setProperties(d.properties || [])).catch(() => {});
    fetch(`${API_URL}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setContacts(d.contacts || [])).catch(() => {});
    fetch(`${API_URL}/api/tours`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setTours(d.tours || [])).catch(() => {});
    fetch(`${API_URL}/api/offers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setOffers(d.offers || [])).catch(() => {});
    fetch(`${API_URL}/api/pre-qualifications`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setPrequals(d.requests || d.prequals || [])).catch(() => {});
    fetch(`${API_URL}/api/newsletter`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setSubscribers(d.subscribers || [])).catch(() => {});
    fetch(`${API_URL}/api/agents`).then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {});
  }, [token]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      return data.url || '';
    } catch { return ''; }
  };

  const uploadFiles = async (files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    try {
      const res = await fetch(`${API_URL}/api/upload-multiple`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      return data.urls || [];
    } catch { return []; }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) { setFormData({ ...formData, image: url }); showToast('Image uploaded!'); }
  };

  const handleImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = await uploadFiles(files);
    if (urls.length > 0) {
      const existing = formData.images ? formData.images.split(',').filter(Boolean) : [];
      setFormData({ ...formData, images: [...existing, ...urls].join(',') });
      showToast(`${urls.length} images uploaded!`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', address: '', city: '', state: '', zip: '', country: 'US',
      price: '', beds: '', baths: '', sqft: '', type: 'House',
      yearBuilt: '', description: '', agent: '', agentPhone: '', agentEmail: '',
      tags: '', image: '', images: '', video: '', floorPlan: '', isPrivate: 0, badge: 'New', featured: false, latitude: '', longitude: '',
      lotSize: '', hoa: '', propertyTaxes: '', garage: '', stories: '', cooling: '', heating: '', parking: '', roof: '', viewType: '', basement: '',
      amenities: '', floorPlans: '', availability: 'Available Now', retail: '', status: 'For Sale'
    });
    setEditId(null);
    setFormOpen(false);
  };

  const openEdit = (p) => {
    const agentObj = p.agent || {};
    const agentName = typeof agentObj === 'string' ? agentObj : agentObj.name || '';
    const tagsStr = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const imagesStr = Array.isArray(p.images) ? p.images.join(', ') : (p.images || '');
    const amenitiesStr = Array.isArray(p.amenities) ? p.amenities.join(', ') : (p.amenities || '');
    const floorPlansStr = Array.isArray(p.floorPlans) ? p.floorPlans.join(', ') : (p.floorPlans || '');
    setFormData({
      title: p.name || p.title || '', address: p.address || '', city: p.city || '', state: p.state || '', zip: p.zipcode || p.zip || '',
      country: p.country || 'US', price: p.price || '', beds: p.beds || '', baths: p.baths || '', sqft: p.size || p.sqft || '', type: p.type || 'House',
      yearBuilt: p.yearBuilt || '', description: p.description || '', agent: agentName, agentPhone: p.agentPhone || (typeof agentObj !== 'string' ? agentObj.phone : '') || '',
      agentEmail: p.agentEmail || (typeof agentObj !== 'string' ? agentObj.email : '') || '', tags: tagsStr, image: p.image || '', images: imagesStr, video: p.video || '',
      floorPlan: p.floorPlan || '', isPrivate: p.isPrivate || 0,
      badge: p.badge || 'New',
      featured: p.featured || false, latitude: p.latitude || '', longitude: p.longitude || '',
      lotSize: p.lotSize || '', hoa: p.hoa || '', propertyTaxes: p.propertyTaxes || '', garage: p.garage || '', stories: p.stories || '',
      cooling: p.cooling || '', heating: p.heating || '', parking: p.parking || '', roof: p.roof || '', viewType: p.viewType || '', basement: p.basement || '',
      amenities: amenitiesStr, floorPlans: floorPlansStr, availability: p.availability || 'Available Now', retail: p.retail || '',
      status: p.status || 'For Sale'
    });
    setEditId(p.id || p._id);
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const imagesArr = formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [];
    const amenitiesArr = formData.amenities ? formData.amenities.split(',').map(s => s.trim()).filter(Boolean) : [];
    const floorPlansArr = formData.floorPlans ? formData.floorPlans.split(',').map(s => s.trim()).filter(Boolean) : [];
    const body = {
      title: formData.title,
      price: formData.price,
      type: formData.type,
      status: formData.status || 'For Sale',
      badge: formData.badge,
      image: formData.image,
      images: imagesArr,
      amenities: amenitiesArr,
      floorPlans: floorPlansArr,
      availability: formData.availability || null,
      retail: formData.retail || null,
      beds: parseInt(formData.beds) || 1,
      baths: parseInt(formData.baths) || 1,
      sqft: formData.sqft,
      description: formData.description,
      yearBuilt: parseInt(formData.yearBuilt) || null,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country,
      latitude: parseFloat(formData.latitude) || null,
      longitude: parseFloat(formData.longitude) || null,
      video: formData.video,
      featured: !!formData.featured,
      tags: formData.tags,
      agent: formData.agent,
      agentPhone: formData.agentPhone,
      agentEmail: formData.agentEmail,
      lotSize: parseFloat(formData.lotSize) || null,
      hoa: parseFloat(formData.hoa) || null,
      propertyTaxes: parseFloat(formData.propertyTaxes) || null,
      garage: parseInt(formData.garage) || null,
      stories: parseInt(formData.stories) || null,
      cooling: formData.cooling || null,
      heating: formData.heating || null,
      parking: formData.parking || null,
      roof: formData.roof || null,
      viewType: formData.viewType || null,
      basement: formData.basement || null,
      floorPlan: formData.floorPlan || null,
      isPrivate: formData.isPrivate ? 1 : 0
    };
    try {
      const url = editId ? `${API_URL}/api/properties/${editId}` : `${API_URL}/api/properties`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (res.ok) {
        showToast(editId ? 'Property updated!' : 'Property created!');
        const d = await fetch(`${API_URL}/api/properties?limit=1000`).then(r => r.json());
        setProperties(d.properties || []);
        resetForm();
      } else {
        showToast('Failed to save property');
      }
    } catch { showToast('Error saving property'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => (p.id || p._id) !== id));
        showToast('Property deleted!');
      }
    } catch { showToast('Error deleting property'); }
    setConfirmDelete(null);
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(p => p.id || p._id));
  };

  const bulkUpdate = async (field, value) => {
    if (selected.length === 0) { showToast('Select properties first'); return; }
    try {
      const res = await fetch(`${API_URL}/api/properties/bulk`, { method: 'POST', headers, body: JSON.stringify({ ids: selected, field, value }) });
      if (res.ok) {
        showToast(`Updated ${selected.length} properties`);
        setSelected([]);
        const d = await fetch(`${API_URL}/api/properties?limit=1000`).then(r => r.json());
        setProperties(d.properties || []);
      } else { showToast('Bulk update failed'); }
    } catch { showToast('Bulk update failed'); }
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} properties?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/properties/bulk`, { method: 'POST', headers, body: JSON.stringify({ ids: selected, field: 'delete', value: true }) });
      if (res.ok) {
        showToast(`Deleted ${selected.length} properties`);
        setSelected([]);
        const d = await fetch(`${API_URL}/api/properties?limit=1000`).then(r => r.json());
        setProperties(d.properties || []);
      } else { showToast('Bulk delete failed'); }
    } catch { showToast('Bulk delete failed'); }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API_URL}/api/properties/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { showToast('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'properties.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { showToast('Export failed'); }
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/properties/import`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d = await res.json();
      showToast(d.message || 'Import complete');
      const props = await fetch(`${API_URL}/api/properties?limit=1000`).then(r => r.json());
      setProperties(props.properties || []);
    } catch { showToast('Import failed'); }
    e.target.value = '';
  };

  const updateOfferStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/offers/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        showToast(`Offer marked ${status}`);
      } else {
        showToast('Failed to update offer');
      }
    } catch { showToast('Error updating offer'); }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try {
      const res = await fetch(`${API_URL}/api/offers/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== id));
        showToast('Offer deleted');
      }
    } catch { showToast('Error deleting offer'); }
  };

  const updateTourStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/tours/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (res.ok) {
        setTours(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        showToast(`Tour marked ${status}`);
      } else {
        showToast('Failed to update tour');
      }
    } catch { showToast('Error updating tour'); }
  };

  const updateContactStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/contacts/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (res.ok) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        showToast(`Contact marked ${status}`);
      } else {
        showToast('Failed to update contact');
      }
    } catch { showToast('Error updating contact'); }
  };

  const updatePrequalStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/pre-qualifications/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (res.ok) {
        setPrequals(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        showToast(`Marked ${status}`);
      } else {
        showToast('Failed to update pre-qualification');
      }
    } catch { showToast('Error updating pre-qualification'); }
  };

  const filtered = properties.filter((p) => {
    const s = searchTerm.toLowerCase();
    return !s || (p.title && p.title.toLowerCase().includes(s)) || (p.city && p.city.toLowerCase().includes(s)) || (p.state && p.state.toLowerCase().includes(s));
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'price') return (a.price - b.price) * dir;
    if (sortField === 'beds') return (a.beds - b.beds) * dir;
    return ((a.title || '').localeCompare(b.title || '')) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!user || !user.isAdmin) return null;

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs current="Admin Dashboard" />
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Welcome back, {user.name}</p>
          </div>
        </div>

        {toast && <div className="admin-toast admin-toast-visible">{toast}</div>}

        <div ref={statsRef} className={`admin-stats-row ${statsVisible ? 'admin-stats-visible' : ''}`}>
          <div className="admin-stat-card" style={{ '--stat-color': '#C9A84C' }}>
            <div className="admin-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V7l9-5 9 5v15"/><path d="M9 22V12h6v10"/></svg></div>
            <div className="admin-stat-number"><AnimatedNum end={properties.length} /></div>
            <div className="admin-stat-label">Properties</div>
          </div>
          <div className="admin-stat-card" style={{ '--stat-color': '#8B7355' }}>
            <div className="admin-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <div className="admin-stat-number"><AnimatedNum end={contacts.length} /></div>
            <div className="admin-stat-label">Contacts</div>
          </div>
          <div className="admin-stat-card" style={{ '--stat-color': '#A8882E' }}>
            <div className="admin-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
            <div className="admin-stat-number"><AnimatedNum end={tours.length} /></div>
            <div className="admin-stat-label">Tours</div>
          </div>
          <div className="admin-stat-card" style={{ '--stat-color': '#2E7D32' }}>
            <div className="admin-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div className="admin-stat-number"><AnimatedNum end={offers.length} /></div>
            <div className="admin-stat-label">Offers</div>
          </div>
          <div className="admin-stat-card" style={{ '--stat-color': '#6D5940' }}>
            <div className="admin-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
            <div className="admin-stat-number"><AnimatedNum end={properties.reduce((a, p) => a + (p.beds || 0), 0)} /></div>
            <div className="admin-stat-label">Total Beds</div>
          </div>
        </div>

        <div className="admin-tabs">
          {['dashboard', 'properties', 'leads', 'open-houses', 'prequals', 'newsletter', 'contacts', 'tours', 'offers', 'analytics', 'notifications', 'testimonials', 'blog', 'chat', 'users', 'settings'].map((t) => (
            <button key={t} className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`} onClick={() => setTab(t)}>
              {t === 'open-houses' ? 'Open Houses' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="admin-tab-content admin-tab-visible">
            <DashboardPanel token={token} properties={properties} />
          </div>
        )}
        {tab === 'leads' && (
          <div className="admin-tab-content admin-tab-visible">
            <LeadPipelinePanel token={token} agents={agents} />
          </div>
        )}
        {tab === 'open-houses' && (
          <div className="admin-tab-content admin-tab-visible">
            <OpenHousesPanel token={token} properties={properties} />
          </div>
        )}
        {tab === 'notifications' && (
          <div className="admin-tab-content admin-tab-visible">
            <NotificationsPanel token={token} />
          </div>
        )}
        {tab === 'users' && (
          <div className="admin-tab-content admin-tab-visible">
            <UsersPanel token={token} currentUser={user} />
          </div>
        )}

        {tab === 'properties' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-toolbar">
              <input type="text" placeholder="Search properties..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="admin-search" />
              <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="admin-sort">
                <option value="title">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="beds">Sort by Beds</option>
              </select>
              <button className="btn-ghost" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}</button>
              <button className="btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>+ Add Property</button>
            </div>

            <div className="admin-bulk-toolbar">
              <label className="admin-check-label">
                <input type="checkbox" checked={selected.length > 0 && selected.length === filtered.length} onChange={toggleSelectAll} />
                <span>Select all ({filtered.length})</span>
              </label>
              <span className="admin-bulk-count">{selected.length} selected</span>
              <div className="admin-bulk-actions">
                <select className="admin-sort" value="" onChange={(e) => { if (e.target.value) bulkUpdate('featured', e.target.value === 'featured'); e.target.value = ''; }}>
                  <option value="">Feature…</option>
                  <option value="featured">Mark featured</option>
                  <option value="not-featured">Unmark featured</option>
                </select>
                <select className="admin-sort" value="" onChange={(e) => { if (e.target.value) bulkUpdate('isPrivate', e.target.value === 'private'); e.target.value = ''; }}>
                  <option value="">Visibility…</option>
                  <option value="private">Make private (VIP)</option>
                  <option value="public">Make public</option>
                </select>
                <button className="admin-btn admin-btn-danger" onClick={bulkDelete} disabled={selected.length === 0}>Delete selected</button>
              </div>
              <div className="admin-csv-actions">
                <button className="admin-btn" onClick={exportCSV}>Export CSV</button>
                <label className="admin-btn admin-btn-outline">
                  Import CSV
                  <input type="file" accept=".csv" hidden onChange={importCSV} />
                </label>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Beds</th>
                    <th>Type</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.id || p._id} className={`admin-table-row ${selected.includes(p.id || p._id) ? 'admin-row-selected' : ''}`}>
                      <td>
                        <input type="checkbox" checked={selected.includes(p.id || p._id)} onChange={() => toggleSelect(p.id || p._id)} />
                      </td>
                      <td>
                        <div className="admin-table-property">
                          <SafeImage src={p.image} alt={p.title} className="admin-table-thumb" />
                          <div><strong>{p.title}</strong>{p.badge && <span className={`admin-badge badge-${p.badge.toLowerCase().replace(/\s+/g, '-')}`}>{p.badge}</span>}</div>
                        </div>
                      </td>
                      <td>{p.city}, {p.state}</td>
                      <td className="admin-price">${p.price.toLocaleString()}</td>
                      <td>{p.beds}</td>
                      <td><span className="admin-type-badge">{p.type}</span></td>
                      <td><span className="admin-status-badge">{p.availability || '—'}</span></td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                          <button className="admin-btn-delete" onClick={() => setConfirmDelete(p.id || p._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>« Prev</button>
                <span className="admin-page-info">Page {page} of {totalPages} ({filtered.length} properties)</span>
                <button className="admin-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next »</button>
              </div>
            )}
          </div>
        )}

        {tab === 'prequals' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Home Price</th><th>Down</th><th>Monthly</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {prequals.length === 0 && <tr><td colSpan={8} className="admin-empty">No pre-qualifications yet.</td></tr>}
                  {prequals.map((q) => (
                    <tr key={q.id} className="admin-table-row">
                      <td><strong>{q.name}</strong></td>
                      <td>{q.email}</td>
                      <td>{q.phone || '-'}</td>
                      <td>{q.homePrice ? `$${Number(q.homePrice).toLocaleString()}` : '-'}</td>
                      <td>{q.downPayment ? `$${Number(q.downPayment).toLocaleString()}` : '-'}</td>
                      <td>{q.monthlyPayment ? `$${Number(q.monthlyPayment).toLocaleString()}` : '-'}</td>
                      <td>
                        <select className="admin-sort" value={q.status || 'new'} onChange={(e) => updatePrequalStatus(q.id, e.target.value)}>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                      </td>
                      <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'newsletter' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Email</th><th>Date</th></tr></thead>
                <tbody>
                  {subscribers.length === 0 && <tr><td colSpan={2} className="admin-empty">No subscribers yet.</td></tr>}
                  {subscribers.map((s) => (
                    <tr key={s.id} className="admin-table-row">
                      <td><strong>{s.email}</strong></td>
                      <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {contacts.length === 0 && <tr><td colSpan={5} className="admin-empty">No contacts yet.</td></tr>}
                  {contacts.map((c) => (
                    <tr key={c.id} className="admin-table-row">
                      <td><strong>{c.name}</strong></td>
                      <td>{c.email}</td>
                      <td className="admin-msg-cell">{(c.message || '').substring(0, 80)}{(c.message || '').length > 80 ? '...' : ''}</td>
                      <td>
                        <select className="admin-sort" value={c.status || 'new'} onChange={(e) => updateContactStatus(c.id, e.target.value)}>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="followed-up">Followed Up</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'tours' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Property</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {tours.length === 0 && <tr><td colSpan={5} className="admin-empty">No tours scheduled.</td></tr>}
                  {tours.map((t) => (
                    <tr key={t.id} className="admin-table-row">
                      <td><strong>{t.name}</strong><br/><span className="admin-sub-text">{t.email}</span></td>
                      <td>{t.propertyTitle || `Property #${t.propertyId}`}</td>
                      <td>{t.preferredDate || '-'}</td>
                      <td>{t.preferredTime || '-'}</td>
                      <td>
                        <select className="admin-sort" value={t.status || 'pending'} onChange={(e) => updateTourStatus(t.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'offers' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Buyer</th><th>Property</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {offers.length === 0 && <tr><td colSpan={6} className="admin-empty">No offers yet.</td></tr>}
                  {offers.map((o) => (
                    <tr key={o.id} className="admin-table-row">
                      <td><strong>{o.name}</strong><br /><span className="admin-sub-text">{o.email}{o.phone ? ` · ${o.phone}` : ''}</span></td>
                      <td>{o.propertyTitle || `Property #${o.propertyId}`}</td>
                      <td className="admin-price">${(o.amount || 0).toLocaleString()}</td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
                      <td><span className={`admin-status-badge admin-status-${o.status || 'pending'}`}>{o.status || 'pending'}</span></td>
                      <td>
                        <select className="admin-sort" defaultValue={o.status || 'pending'} onChange={(e) => updateOfferStatus(o.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="countered">Countered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button className="admin-btn-delete" onClick={() => deleteOffer(o.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="admin-tab-content admin-tab-visible">
            <AnalyticsPanel token={token} />
          </div>
        )}
        {tab === 'testimonials' && (
          <div className="admin-tab-content admin-tab-visible">
            <TestimonialsPanel token={token} />
          </div>
        )}
        {tab === 'blog' && (
          <div className="admin-tab-content admin-tab-visible">
            <BlogPanel token={token} />
          </div>
        )}
        {tab === 'chat' && (
          <div className="admin-tab-content admin-tab-visible">
            <ChatPanel token={token} />
          </div>
        )}
        {tab === 'settings' && (
          <div className="admin-tab-content admin-tab-visible">
            <div className="admin-settings-card">
              <h3>Admin Profile</h3>
              <div className="admin-profile-row">
                <div className="admin-avatar-lg">{user.name?.charAt(0) || 'A'}</div>
                <div><strong>{user.name}</strong><span>{user.email}</span><span className="admin-role-badge">Administrator</span></div>
              </div>
            </div>
            <div className="admin-settings-card">
              <h3>Database</h3>
              <p className="admin-sub-text">Properties: {properties.length} | Contacts: {contacts.length} | Tours: {tours.length} | Pre-quals: {prequals.length} | Subscribers: {subscribers.length}</p>
            </div>
            <div className="admin-settings-card">
              <h3>Email / SMTP Test</h3>
              <p className="admin-sub-text">Sends a test message through your configured SMTP server (see .env).</p>
              <div className="admin-form-actions" style={{ marginTop: 12 }}>
                <button className="btn-primary" onClick={async () => {
                  showToast('Sending test email...');
                  try {
                    const res = await fetch(`${API_URL}/api/settings/smtp-test`, { method: 'POST', headers });
                    const d = await res.json();
                    showToast(d.message || d.error || 'SMTP test result');
                  } catch { showToast('SMTP test failed to reach server'); }
                }}>Send test email</button>
              </div>
            </div>
          </div>
        )}

        {formOpen && (
          <div className="modal-overlay" onClick={() => setFormOpen(false)}>
            <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setFormOpen(false)}>×</button>
              <h2>{editId ? 'Edit Property' : 'Add Property'}</h2>
              <form onSubmit={handleSave} className="admin-form">
                <div className="form-row-2">
                  <div className="form-group"><label>Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                  <div className="form-group"><label>Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      <option>House</option><option>Apartment</option><option>Condo</option><option>Villa</option><option>Cottage</option><option>Penthouse</option><option>Townhouse</option><option>Retail</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></div>
                <div className="form-row-3">
                  <div className="form-group"><label>City</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required /></div>
                  <div className="form-group"><label>State</label><input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required /></div>
                  <div className="form-group"><label>Zipcode</label><input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required /></div>
                  <div className="form-group"><label>Country</label><input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="US" /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Price ($)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                  <div className="form-group"><label>Beds</label><input type="number" value={formData.beds} onChange={(e) => setFormData({ ...formData, beds: e.target.value })} required /></div>
                  <div className="form-group"><label>Baths</label><input type="number" value={formData.baths} onChange={(e) => setFormData({ ...formData, baths: e.target.value })} required /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Sq Ft</label><input type="number" value={formData.sqft} onChange={(e) => setFormData({ ...formData, sqft: e.target.value })} required /></div>
                  <div className="form-group"><label>Year Built</label><input type="number" value={formData.yearBuilt} onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })} /></div>
                  <div className="form-group"><label>Badge</label>
                    <select value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })}>
                      <option>New</option><option>Premium</option><option>Hot Deal</option><option>Exclusive</option><option>Family Favorite</option><option>Beach Life</option><option>None</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Description</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="form-group"><label>Image URL</label>
                  <div className="admin-upload-row">
                    <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                    <label className="admin-upload-btn">
                      Upload File
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    </label>
                  </div>
                </div>
                {formData.image && <div className="admin-form-preview"><SafeImage src={formData.image} alt="Preview" /></div>}
                <div className="form-group"><label>Virtual Tour Video URL (YouTube embed)</label><input type="url" value={formData.video} onChange={(e) => setFormData({ ...formData, video: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Floor Plan Image URL</label><input type="url" value={formData.floorPlan} onChange={(e) => setFormData({ ...formData, floorPlan: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="form-group admin-featured-toggle" style={{ paddingTop: 22 }}><label>Private (VIP)</label>
                    <button type="button" className={`admin-toggle ${formData.isPrivate ? 'admin-toggle-on' : ''}`} onClick={() => setFormData({ ...formData, isPrivate: formData.isPrivate ? 0 : 1 })}>
                      <span className="admin-toggle-knob" />
                    </button>
                  </div>
                </div>
                <div className="form-group"><label>Additional Images (comma-separated URLs)</label>
                  <div className="admin-upload-row">
                    <input type="text" value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} placeholder="https://..., https://..." />
                    <label className="admin-upload-btn">
                      Upload Files
                      <input type="file" accept="image/*" multiple onChange={handleImagesUpload} hidden />
                    </label>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Amenities (comma-separated)</label><input type="text" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} placeholder="Pool,Gym,Fireplace" /></div>
                  <div className="form-group"><label>Availability</label>
                    <select value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })}>
                      <option>Available Now</option><option>Available Soon</option><option>By Appointment</option><option>Lease to Own</option><option>Sold</option><option>Pending</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Retail Info (if commercial)</label><input type="text" value={formData.retail} onChange={(e) => setFormData({ ...formData, retail: e.target.value })} placeholder="Storefront, Leasehold..." /></div>
                </div>
                <div className="form-group"><label>Floor Plan Image URLs (comma-separated)</label>
                  <div className="admin-upload-row">
                    <input type="text" value={formData.floorPlans} onChange={(e) => setFormData({ ...formData, floorPlans: e.target.value })} placeholder="https://..., https://..." />
                    <label className="admin-upload-btn">
                      Upload Files
                      <input type="file" accept="image/*" multiple onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const urls = await uploadFiles(files);
                        if (urls.length > 0) {
                          const existing = formData.floorPlans ? formData.floorPlans.split(',').filter(Boolean) : [];
                          setFormData({ ...formData, floorPlans: [...existing, ...urls].join(',') });
                          showToast(`${urls.length} floor plans uploaded!`);
                        }
                      }} hidden />
                    </label>
                  </div>
                </div>
                <div className="form-group"><label>Tags (comma-separated)</label><input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="pool,garden,luxury" /></div>
                <div className="form-row-3">
                  <div className="form-group"><label>Agent Name</label><input type="text" value={formData.agent} onChange={(e) => setFormData({ ...formData, agent: e.target.value })} /></div>
                  <div className="form-group"><label>Agent Phone</label><input type="tel" value={formData.agentPhone} onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })} /></div>
                  <div className="form-group"><label>Agent Email</label><input type="email" value={formData.agentEmail} onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })} /></div>
                </div>
                <details className="admin-details">
                  <summary>Additional Details</summary>
                  <div className="form-row-3">
                    <div className="form-group"><label>Lot Size (acres)</label><input type="number" step="any" value={formData.lotSize} onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })} placeholder="0.5" /></div>
                    <div className="form-group"><label>HOA ($/month)</label><input type="number" value={formData.hoa} onChange={(e) => setFormData({ ...formData, hoa: e.target.value })} placeholder="350" /></div>
                    <div className="form-group"><label>Property Taxes ($/yr)</label><input type="number" value={formData.propertyTaxes} onChange={(e) => setFormData({ ...formData, propertyTaxes: e.target.value })} placeholder="14400" /></div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group"><label>Garage Spaces</label><input type="number" value={formData.garage} onChange={(e) => setFormData({ ...formData, garage: e.target.value })} placeholder="2" /></div>
                    <div className="form-group"><label>Stories</label><input type="number" value={formData.stories} onChange={(e) => setFormData({ ...formData, stories: e.target.value })} placeholder="2" /></div>
                    <div className="form-group"><label>Basement</label>
                      <select value={formData.basement} onChange={(e) => setFormData({ ...formData, basement: e.target.value })}>
                        <option value="">None</option><option>Finished</option><option>Unfinished</option><option>Partial</option><option>Walk-out</option><option>Crawlspace</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group"><label>Cooling</label>
                      <select value={formData.cooling} onChange={(e) => setFormData({ ...formData, cooling: e.target.value })}>
                        <option value="">None</option><option>Central AC</option><option>Window Unit</option><option>Evaporative</option><option>Ductless</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Heating</label>
                      <select value={formData.heating} onChange={(e) => setFormData({ ...formData, heating: e.target.value })}>
                        <option value="">None</option><option>Forced Air</option><option>Radiator</option><option>Electric</option><option>Radiant</option><option>Heat Pump</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Parking</label>
                      <select value={formData.parking} onChange={(e) => setFormData({ ...formData, parking: e.target.value })}>
                        <option value="">None</option><option>Garage - Attached</option><option>Garage - Detached</option><option>Underground Garage</option><option>Driveway</option><option>Street Parking</option><option>Gated Community</option><option>Valet Garage</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group"><label>Roof</label>
                      <select value={formData.roof} onChange={(e) => setFormData({ ...formData, roof: e.target.value })}>
                        <option value="">None</option><option>Tile</option><option>Shingle</option><option>Flat</option><option>Composition</option><option>Metal</option><option>Slate</option>
                      </select>
                    </div>
                    <div className="form-group"><label>View Type</label>
                      <input type="text" value={formData.viewType} onChange={(e) => setFormData({ ...formData, viewType: e.target.value })} placeholder="Ocean, City, Mountain..." />
                    </div>
                    <div className="form-group"><label>Status</label>
                      <select value={formData.status || 'For Sale'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                        <option>For Sale</option><option>For Rent</option><option>Sold</option><option>Pending</option>
                      </select>
                    </div>
                  </div>
                </details>
                <div className="form-row-3">
                  <div className="form-group"><label>Latitude</label><input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} /></div>
                  <div className="form-group"><label>Longitude</label><input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} /></div>
                  <div className="form-group admin-featured-toggle"><label>Featured</label>
                    <button type="button" className={`admin-toggle ${formData.featured ? 'admin-toggle-on' : ''}`} onClick={() => setFormData({ ...formData, featured: !formData.featured })}>
                      <span className="admin-toggle-knob" />
                    </button>
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn-primary">{editId ? 'Update Property' : 'Create Property'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="modal-content admin-confirm" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Property?</h3>
              <p>This action cannot be undone.</p>
              <div className="admin-confirm-actions">
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn-admin-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
