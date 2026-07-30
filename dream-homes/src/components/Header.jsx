import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MortgageCalculator from './MortgageCalculator';

export default function Header() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/properties" className="nav-link" onClick={() => setMenuOpen(false)}>Properties</Link>
            <Link to="/agents" className="nav-link" onClick={() => setMenuOpen(false)}>Agents</Link>
            <Link to="/blog" className="nav-link" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</Link>
          </nav>

          <div className="header-search-wrap">
            <form className={`header-search ${searchOpen ? 'header-search-open' : ''}`} onSubmit={handleSearch}>
              <svg className="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input ref={searchInputRef} type="text" placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onBlur={() => !searchQuery && setSearchOpen(false)} />
            </form>
            <button className="header-search-toggle" onClick={() => setSearchOpen(!searchOpen)} aria-label="Toggle search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-ghost header-calc-btn" onClick={() => setCalcOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>
              Calculator
            </button>
            <Link to="/map" className="btn-ghost header-map-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Map View
            </Link>

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

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
                      <Link to="/profile" className="dropdown-item" onClick={() => setAccountOpen(false)}>Profile</Link>
                      {user.isAdmin && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setAccountOpen(false)}>Admin Dashboard</Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-item-danger" onClick={() => { logout(); setAccountOpen(false); }}>Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/signin" className="dropdown-item" onClick={() => setAccountOpen(false)}>Sign In</Link>
                      <Link to="/signup" className="dropdown-item" onClick={() => setAccountOpen(false)}>Sign Up</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
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
