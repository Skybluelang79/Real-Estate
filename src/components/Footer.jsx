import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
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
            <p className="footer-tagline">Finding your perfect home since 2026.</p>
          </div>
          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/properties">Properties</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-links-col">
            <h4>Contact</h4>
            <span>123 Dream Street</span>
            <span>Los Angeles, CA 90001</span>
            <span>info@dreamhomes.com</span>
            <span>(800) 555-HOME</span>
          </div>
          <div className="footer-links-col">
            <h4>Follow Us</h4>
            <div className="footer-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Dream Homes Real Estate. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
