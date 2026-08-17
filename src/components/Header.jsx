import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthCtx';
import { useTheme } from '../context/ThemeCtx';
import { useLanguage } from '../context/LanguageCtx';
import MortgageCalculator from './MortgageCalculator';
import API_URL from '../config';

export default function Header() {
  const { user, token, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = useCallback(() => {
    if (!token || !user?.isAdmin) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/notifications/unread-count`, { headers })
      .then(r => r.json()).then(d => setUnread(d.count || 0)).catch(() => {});
    if (notifOpen) {
      fetch(`${API_URL}/api/notifications`, { headers })
        .then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
    }
  }, [token, user, notifOpen]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAllRead = async () => {
    if (!token) return;
    await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setUnread(0);
    setNotifications(notifications.map(n => ({ ...n, read: 1 })));
  };

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/properties?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-inner">
          <Link to="/" className="logo">
            <svg className="logo-icon" width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L2 12v18h10V20h8v10h10V12L16 2z" fill="url(#logo-grad)" />
              <path d="M16 6L6 13v15h4V18h12v10h4V13l-10-7z" fill="#1A1714" />
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="30" y2="30">
                  <stop offset="0%" stopColor="#C9A84C" />
                  <stop offset="100%" stopColor="#A8882E" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-text">Dream Homes</span>
          </Link>

          <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
            <Link to="/properties" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.properties')}</Link>
            <Link to="/agents" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.agents')}</Link>
            <Link to="/neighborhoods" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.neighborhoods')}</Link>
            <Link to="/private" className="nav-link nav-link-gold" onClick={() => setMenuOpen(false)}>{t('nav.private')}</Link>
            <Link to="/blog" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.blog')}</Link>
            <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.about')}</Link>
            <Link to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
            <div className="nav-mobile-extras">
              <button className="theme-toggle mobile-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {darkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
                <span className="mobile-theme-label">{darkMode ? t('header.lightMode') || 'Light' : t('header.darkMode') || 'Dark'}</span>
              </button>
              <div className="mobile-lang">
                <span className="mobile-lang-label">Language</span>
                <div className="mobile-lang-options">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'zh', label: '简体中文' },
                    { code: 'es', label: 'Español' },
                  ].map((l) => (
                    <button key={l.code} className={`mobile-lang-btn ${lang === l.code ? 'mobile-lang-btn-active' : ''}`} onClick={() => setLang(l.code)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="header-search-wrap">
            <form className={`header-search ${searchOpen ? 'header-search-open' : ''}`} onSubmit={handleSearch}>
              <svg className="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input ref={searchInputRef} type="text" placeholder={t('header.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onBlur={() => !searchQuery && setSearchOpen(false)} />
            </form>
            <button className="header-search-toggle" onClick={() => setSearchOpen(!searchOpen)} aria-label="Toggle search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-ghost header-calc-btn" onClick={() => setCalcOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>
              <span className="header-btn-label">{t('header.calculator')}</span>
            </button>
            <Link to="/map" className="btn-ghost header-map-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="header-btn-label">{t('header.mapView')}</span>
            </Link>

            <div className="lang-dropdown" ref={langRef}>
              <button className="lang-toggle" onClick={() => setLangOpen(!langOpen)} aria-label="Change language">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span className="lang-code">{lang.toUpperCase()}</span>
              </button>
              {langOpen && (
                <div className="dropdown-menu lang-menu">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'zh', label: '简体中文' },
                    { code: 'es', label: 'Español' },
                  ].map((l) => (
                    <button key={l.code} className={`dropdown-item ${lang === l.code ? 'dropdown-item-active' : ''}`} onClick={() => { setLang(l.code); setLangOpen(false); }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {user && user.isAdmin && (
              <div className="notif-dropdown" ref={notifRef}>
                <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-menu notif-menu">
                    <div className="notif-menu-head">
                      <strong>Notifications</strong>
                      <button className="notif-mark-all" onClick={markAllRead} disabled={unread === 0}>Mark all read</button>
                    </div>
                    <div className="notif-menu-body">
                      {notifications.length === 0 && <p className="notif-empty">No notifications</p>}
                      {notifications.slice(0, 8).map(n => (
                        <div key={n.id} className={`notif-item ${!n.read ? 'notif-item-unread' : ''}`}>
                          <span className={`dash-feed-dot dash-dot-${n.type || 'info'}`} />
                          <div>
                            <p>{n.message}</p>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link to="/admin" className="notif-menu-footer" onClick={() => setNotifOpen(false)}>View all in admin</Link>
                  </div>
                )}
              </div>
            )}

            <div className="account-dropdown" ref={dropdownRef}>
              <button className="account-btn" onClick={() => setAccountOpen(!accountOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {user && <span className="account-name">{user.name.split(' ')[0]}</span>}
              </button>
              {accountOpen && (
                <div className="dropdown-menu">
                  {user ? (
                    <>
                      <div className="dropdown-header">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/profile" className="dropdown-item" onClick={() => setAccountOpen(false)}>{t('header.profile')}</Link>
                      {user.isAdmin && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setAccountOpen(false)}>{t('header.admin')}</Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-item-danger" onClick={() => { logout(); setAccountOpen(false); }}>{t('header.logout')}</button>
                    </>
                  ) : (
                    <>
                      <Link to="/signin" className="dropdown-item" onClick={() => setAccountOpen(false)}>{t('header.signIn')}</Link>
                      <Link to="/signup" className="dropdown-item" onClick={() => setAccountOpen(false)}>{t('header.signUp')}</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label={t('header.menu')}>
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </header>
      <MortgageCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}
