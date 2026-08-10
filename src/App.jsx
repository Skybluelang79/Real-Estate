import { Suspense, lazy } from 'react'
import { Routes, Route, Link, useSearchParams, useLocation } from 'react-router'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import PropertyCard from './components/PropertyCard'
import StatsSection from './components/StatsSection'
import ServicesSection from './components/ServicesSection'
import NeighborhoodsPreview from './components/NeighborhoodsPreview'
import CtaBanner from './components/CtaBanner'
import Sponsors from './components/Sponsors'
import Advertisements from './components/Advertisements'
import Testimonials from './components/Testimonials'
import JustListed from './components/JustListed'
import RecentlyViewed from './components/RecentlyViewed'
import OpenHousesSection from './components/OpenHousesSection'
import HomeTools from './components/HomeTools'
import AgentSpotlight from './components/AgentSpotlight'
import BlogPreview from './components/BlogPreview'
import NeighborhoodPriceTrends from './components/NeighborhoodPriceTrends'
import NewsletterPopup from './components/NewsletterPopup'
import SaveSearchPrompt from './components/SaveSearchPrompt'
import CompareFloatingBar from './components/CompareFloatingBar'
import BackToTop from './components/BackToTop'
import QuickContact from './components/QuickContact'
import Breadcrumbs from './components/Breadcrumbs'
import ChatWidget from './components/ChatWidget'
import Seo from './components/Seo'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import API_URL from './config'
import usePageTitle from './hooks/usePageTitle'
import useDebounce from './hooks/useDebounce'
import { useFeaturedPropertiesQuery, usePropertiesQuery } from './api/properties'

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
const Financing = lazy(() => import('./pages/Financing'))
const Valuation = lazy(() => import('./pages/Valuation'))
const Moving = lazy(() => import('./pages/Moving'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PrivateCollection = lazy(() => import('./pages/PrivateCollection'))
const Neighborhoods = lazy(() => import('./pages/Neighborhoods'))
const NeighborhoodDetail = lazy(() => import('./pages/NeighborhoodDetail'))
const AgentDetail = lazy(() => import('./pages/AgentDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))
const MiniMap = lazy(() => import('./components/MiniMap'))

const ROUTE_SEO = {
  '/': { title: 'Luxury Real Estate', description: 'Dream Homes — luxury real estate brokerage. Discover curated oceanfront estates, penthouses and exclusive listings across Los Angeles.' },
  '/properties': { title: 'Properties for Sale', description: 'Browse luxury homes, apartments, condos and penthouses for sale and for rent at Dream Homes.' },
  '/agents': { title: 'Our Agents', description: 'Meet the Dream Homes team — trusted advisors with deep knowledge of the Los Angeles luxury market.' },
  '/blog': { title: 'Real Estate Insights', description: 'Market trends, home buying guides and staging advice from the Dream Homes blog.' },
  '/about': { title: 'About Us', description: 'Dream Homes is a luxury real estate brokerage delivering white-glove service since 2026.' },
  '/contact': { title: 'Contact Us', description: 'Get in touch with Dream Homes. Our agents are ready to help you buy, sell or rent.' },
  '/financing': { title: 'Mortgage & Financing', description: 'Mortgage calculators, pre-qualification and financing guidance for your next home purchase.' },
  '/valuation': { title: 'Home Valuation', description: "Get a free, instant home valuation from Dream Homes' expert agents." },
  '/moving': { title: 'Moving Services', description: 'Partner with trusted movers for a stress-free relocation to your new home.' },
  '/neighborhoods': { title: 'Neighborhood Guides', description: "Explore guides to Los Angeles' most desirable neighborhoods — schools, commute, walk scores and homes." },
  '/private': { title: 'The Private Collection', description: 'Off-market and by-appointment luxury residences reserved exclusively for Dream Homes members.' },
  '/map': { title: 'Map View', description: 'Explore Dream Homes properties on an interactive map.' },
  '/compare': { title: 'Compare Properties', description: 'Side-by-side comparison of your favorite Dream Homes listings.' },
};

function RouteSeo() {
  const { pathname } = useLocation();
  const seo = ROUTE_SEO[pathname] || {};
  return <Seo {...seo} path={pathname} />;
}

function Home() {
  usePageTitle('Home');
  const { t } = useLanguage();
  const { data, isLoading, isError } = useFeaturedPropertiesQuery();
  const properties = (data?.properties || []).slice(0, 3);

  return (
    <>
      <Hero properties={properties} />
      <SaveSearchPrompt />
      <StatsSection />
      <JustListed />
      <RecentlyViewed />
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.featuredTitle')}</h2>
            <p>{t('home.featuredSub')}</p>
          </div>
          {isLoading ? (
            <div className="property-grid">
              {Array.from({ length: 3 }).map((_, i) => (
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
          ) : isError ? (
            <div className="empty-state">
              <p>{t('home.emptyState')}</p>
              <Link to="/properties" className="btn-primary" style={{ marginTop: '16px' }}>{t('home.browseProperties')}</Link>
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <p>{t('home.emptyState')}</p>
              <Link to="/properties" className="btn-primary" style={{ marginTop: '16px' }}>{t('home.browseProperties')}</Link>
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
      <ServicesSection />
      <HomeTools />
      <OpenHousesSection />
      <NeighborhoodPriceTrends />
      <NeighborhoodsPreview />
      <AgentSpotlight />
      <Suspense fallback={null}>
        <MiniMap />
      </Suspense>
      <Testimonials />
      <BlogPreview />
      <CtaBanner />
      <Advertisements />
      <Sponsors />
      <NewsletterPopup />
    </>
  );
}

function PropertiesPage() {
  usePageTitle('Properties');
  const { token } = useAuth();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
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

  const debouncedSearch = useDebounce(search, 400);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);
  const debouncedMinYear = useDebounce(minYear, 400);
  const debouncedMaxYear = useDebounce(maxYear, 400);
  const debouncedMinSqft = useDebounce(minSqft, 400);
  const debouncedMaxSqft = useDebounce(maxSqft, 400);

  const amenityOptions = ['Pool', 'Garage', 'Garden', 'Fireplace', 'Gym', 'Balcony', 'Parking', 'Central AC', 'Hardwood', 'Stainless Steel', 'Smart Home', 'Wine Cellar', 'Roof Terrace', 'Home Office'];

  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    setSearch(initialSearch);
  }, [searchParams]);

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const params = {
    search: debouncedSearch,
    type,
    status,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    beds,
    baths,
    minYear: debouncedMinYear,
    maxYear: debouncedMaxYear,
    minSqft: debouncedMinSqft,
    maxSqft: debouncedMaxSqft,
    amenities,
    sort,
    page,
    limit,
  };

  const { data, isLoading, isError } = usePropertiesQuery(params);
  const properties = data?.properties || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const resetFilters = () => {
    setSearch(''); setType(''); setStatus(''); setMinPrice(''); setMaxPrice(''); setBeds(''); setBaths(''); setMinYear(''); setMaxYear(''); setMinSqft(''); setMaxSqft(''); setAmenities([]); setSort(''); setPage(1);
  };

  const hasFilters = search || type || status || minPrice || maxPrice || beds || baths || minYear || maxYear || minSqft || maxSqft || amenities.length > 0 || sort;

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs />
        <div className="section-header">
          <h2>{t('properties.title')}</h2>
          <p>{t('properties.subtitle')}</p>
        </div>

        <div className="properties-filters">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder={t('properties.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-select">
            <option value="">{t('properties.allStatus')}</option>
            <option value="For Sale">{t('properties.forSale')}</option>
            <option value="For Rent">{t('properties.forRent')}</option>
            <option value="Sold">{t('properties.sold')}</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="filter-select">
            <option value="">{t('properties.allTypes')}</option>
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Villa">Villa</option>
            <option value="Cottage">Cottage</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Townhouse">Townhouse</option>
          </select>
          <select value={beds} onChange={(e) => setBeds(e.target.value)} className="filter-select">
            <option value="">{t('properties.anyBeds')}</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
          <input type="number" placeholder={t('properties.minPrice')} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="filter-input" min="0" />
          <input type="number" placeholder={t('properties.maxPrice')} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="filter-input" min="0" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
            <option value="">{t('properties.defaultSort')}</option>
            <option value="price-low">{t('properties.priceLow')}</option>
            <option value="price-high">{t('properties.priceHigh')}</option>
            <option value="newest">{t('properties.newest')}</option>
          </select>
          <button className="advanced-filters-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            {showAdvanced ? t('properties.lessFilters') : t('properties.moreFilters')}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-filters">
            <label>{t('properties.baths')} <span>{t('properties.minimum')}</span>
              <select value={baths} onChange={e => setBaths(e.target.value)}>
                <option value="">Any</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label>{t('properties.minYear')} <span>{t('properties.built')}</span>
              <input type="number" placeholder="e.g. 2000" value={minYear} onChange={e => setMinYear(e.target.value)} min="1900" max="2026" />
            </label>
            <label>{t('properties.maxYear')} <span>{t('properties.built')}</span>
              <input type="number" placeholder="e.g. 2026" value={maxYear} onChange={e => setMaxYear(e.target.value)} min="1900" max="2026" />
            </label>
            <label>{t('properties.minSqft')}
              <input type="number" placeholder="e.g. 1000" value={minSqft} onChange={e => setMinSqft(e.target.value)} min="0" />
            </label>
            <label>{t('properties.maxSqft')}
              <input type="number" placeholder="e.g. 5000" value={maxSqft} onChange={e => setMaxSqft(e.target.value)} min="0" />
            </label>
            <div className="advanced-amenities">
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>{t('properties.amenities')}</span>
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
          <span className="properties-count">{total} {total === 1 ? t('properties.property') : t('properties.propertiesFound')}</span>
          {hasFilters && <button className="btn-ghost btn-sm" onClick={resetFilters}>{t('properties.clearFilters')}</button>}
          {token && hasFilters && (
            <button className="btn-ghost btn-sm" onClick={async () => {
              try {
                  const filters = { search, type, status, minPrice, maxPrice, beds, baths, minYear, maxYear, minSqft, maxSqft, amenities, sort };
                await fetch(`${API_URL}/api/saved-searches`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: `${search || type || 'All'} Search`, filters })
                });
                setSaveMsg(t('properties.searchSaved'));
                setTimeout(() => setSaveMsg(''), 3000);
              } catch {}
            }}>
              {t('properties.saveSearch')}
            </button>
          )}
          {saveMsg && <span className="admin-sub-text" style={{ marginLeft: 8, color: 'var(--success)' }}>{saveMsg}</span>}
        </div>

        <div className="properties-layout">
          <div className="properties-main">
            {isLoading ? (
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
            ) : isError ? (
              <div className="empty-state">
                <p>{t('properties.noResults')}</p>
                <p className="admin-sub-text" style={{ marginTop: 8 }}>{t('properties.loadError') || 'Could not load properties. Please try again.'}</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="empty-state">
                <p>{t('properties.noResults')}</p>
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
                    <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('properties.previous')}</button>
                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} className={`pagination-page ${p === page ? 'pagination-page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                      ))}
                    </div>
                    <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t('properties.next')}</button>
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
  const { t } = useLanguage();
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">{t('skipToContent')}</a>
      <BackToTop />
      <RouteSeo />
      <Header />
      <CompareFloatingBar />
      <ChatWidget user={user} />
      <QuickContact />
      <main id="main-content" className="main">
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/financing" element={<Financing />} />
            <Route path="/valuation" element={<Valuation />} />
            <Route path="/moving" element={<Moving />} />
            <Route path="/neighborhoods" element={<Neighborhoods />} />
            <Route path="/neighborhoods/:slug" element={<NeighborhoodDetail />} />
            <Route path="/private" element={<PrivateCollection />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App