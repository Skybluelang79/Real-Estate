import { Routes, Route, Link, useSearchParams, Suspense, lazy } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import PropertyCard from './components/PropertyCard'
import Sponsors from './components/Sponsors'
import Advertisements from './components/Advertisements'
import Testimonials from './components/Testimonials'
import CompareFloatingBar from './components/CompareFloatingBar'
import BackToTop from './components/BackToTop'
import Breadcrumbs from './components/Breadcrumbs'
import ChatWidget from './components/ChatWidget'
import { useState, useEffect, useContext } from 'react'
import { useAuth } from './context/AuthContext'
import API_URL from './config'
import usePageTitle from './hooks/usePageTitle'

const PropertyDetail = lazy(() => import('./pages/PropertyDetail'))
const SignIn = lazy(() => import('./pages/SignIn'))
const SignUp = lazy(() => import('./pages/SignUp'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const MapView = lazy(() => import('./pages/MapView'))
const Agents = lazy(() => import('./pages/Agents'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Compare = lazy(() => import('./pages/Compare'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Home() {
  usePageTitle('Home');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/properties`)
      .then((res) => res.json())
      .then((data) => setProperties((data.properties || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <>
      <Hero />
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Properties</h2>
            <p>Handpicked homes that define luxury and comfort</p>
          </div>
          {properties.length === 0 ? (
            <div className="empty-state">
              <p>No properties available yet.</p>
              <Link to="/properties" className="btn-primary" style={{ marginTop: '16px' }}>Browse Properties</Link>
            </div>
          ) : (
            <div className="property-grid">
              {properties.map((p) => (
                <PropertyCard key={p.id || p._id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Testimonials />
      <Advertisements />
      <Sponsors />
    </>
  );
}

function PropertiesPage() {
  usePageTitle('Properties');
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [minSqft, setMinSqft] = useState('');
  const [maxSqft, setMaxSqft] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sort, setSort] = useState('');
  const [searchParams] = useSearchParams();
  const limit = 12;
  const [saveMsg, setSaveMsg] = useState('');

  const amenityOptions = ['Pool', 'Garage', 'Garden', 'Fireplace', 'Gym', 'Balcony', 'Parking', 'Central AC', 'Hardwood', 'Stainless Steel', 'Smart Home', 'Wine Cellar', 'Roof Terrace', 'Home Office'];

  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    setSearch(initialSearch);
  }, [searchParams]);

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);
    if (minYear) params.set('minYear', minYear);
    if (maxYear) params.set('maxYear', maxYear);
    if (minSqft) params.set('minSqft', minSqft);
    if (maxSqft) params.set('maxSqft', maxSqft);
    if (amenities.length > 0) params.set('amenities', amenities.join(','));
    if (sort) params.set('sort', sort);
    params.set('page', page);
    params.set('limit', limit);

    setLoading(true);
    fetch(`${API_URL}/api/properties?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => { setProperties(data.properties || []); setTotal(data.total || 0); setTotalPages(data.totalPages || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, type, status, minPrice, maxPrice, beds, baths, minYear, maxYear, minSqft, maxSqft, amenities, sort, page]);

  const resetFilters = () => {
    setSearch(''); setType(''); setStatus(''); setMinPrice(''); setMaxPrice(''); setBeds(''); setBaths(''); setMinYear(''); setMaxYear(''); setMinSqft(''); setMaxSqft(''); setAmenities([]); setSort(''); setPage(1);
  };

  const hasFilters = search || type || status || minPrice || maxPrice || beds || baths || minYear || maxYear || minSqft || maxSqft || amenities.length > 0 || sort;

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs />
        <div className="section-header">
          <h2>All Properties</h2>
          <p>Browse our complete collection of homes</p>
        </div>

        <div className="properties-filters">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search by name, city, state..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-select">
            <option value="">All Status</option>
            <option value="For Sale">For Sale</option>
            <option value="For Rent">For Rent</option>
            <option value="Sold">Sold</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="filter-select">
            <option value="">All Types</option>
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Villa">Villa</option>
            <option value="Cottage">Cottage</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Townhouse">Townhouse</option>
          </select>
          <select value={beds} onChange={(e) => setBeds(e.target.value)} className="filter-select">
            <option value="">Any Beds</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
          <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="filter-input" min="0" />
          <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="filter-input" min="0" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
            <option value="">Default Sort</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
          <button className="advanced-filters-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            {showAdvanced ? 'Less Filters' : 'More Filters'}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-filters">
            <label>Baths <span>minimum</span>
              <select value={baths} onChange={e => setBaths(e.target.value)}>
                <option value="">Any</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label>Min Year <span>built</span>
              <input type="number" placeholder="e.g. 2000" value={minYear} onChange={e => setMinYear(e.target.value)} min="1900" max="2026" />
            </label>
            <label>Max Year <span>built</span>
              <input type="number" placeholder="e.g. 2026" value={maxYear} onChange={e => setMaxYear(e.target.value)} min="1900" max="2026" />
            </label>
            <label>Min Sq Ft
              <input type="number" placeholder="e.g. 1000" value={minSqft} onChange={e => setMinSqft(e.target.value)} min="0" />
            </label>
            <label>Max Sq Ft
              <input type="number" placeholder="e.g. 5000" value={maxSqft} onChange={e => setMaxSqft(e.target.value)} min="0" />
            </label>
            <div className="advanced-amenities">
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Amenities</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {amenityOptions.map(a => (
                  <button key={a} className={`amenity-chip ${amenities.includes(a) ? 'amenity-chip-active' : ''}`} onClick={() => toggleAmenity(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="properties-meta">
          <span className="properties-count">{total} {total === 1 ? 'property' : 'properties'} found</span>
          {hasFilters && <button className="btn-ghost btn-sm" onClick={resetFilters}>Clear Filters</button>}
          {token && hasFilters && (
            <button className="btn-ghost btn-sm" onClick={async () => {
              try {
                  const filters = { search, type, status, minPrice, maxPrice, beds, baths, minYear, maxYear, minSqft, maxSqft, amenities, sort };
                await fetch(`${API_URL}/api/saved-searches`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: `${search || type || 'All'} Search`, filters })
                });
                setSaveMsg('Search saved!');
                setTimeout(() => setSaveMsg(''), 3000);
              } catch {}
            }}>
              Save Search
            </button>
          )}
          {saveMsg && <span className="admin-sub-text" style={{ marginLeft: 8, color: 'var(--success)' }}>{saveMsg}</span>}
        </div>

        <div className="properties-layout">
          <div className="properties-main">
            {loading ? (
              <div className="property-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="property-card skeleton-card">
                    <div className="skeleton-img" />
                    <div className="skeleton-body">
                      <div className="skeleton-line skeleton-lg" />
                      <div className="skeleton-line skeleton-sm" />
                      <div className="skeleton-line skeleton-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="empty-state">
                <p>No properties found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="property-grid">
                  {properties.map((p) => (
                    <PropertyCard key={p.id || p._id} property={p} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} className={`pagination-page ${p === page ? 'pagination-page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                      ))}
                    </div>
                    <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </div>
          <Advertisements variant="sidebar" />
        </div>
      </div>
    </section>
  );
}

function App() {
  const { user } = useAuth();
  return (
    <div className="app">
      <BackToTop />
      <Header />
      <CompareFloatingBar />
      <ChatWidget user={user} />
      <main className="main">
        <Suspense fallback={<div className="page-loader"><div className="spinner" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App