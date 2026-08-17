const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const configured = (import.meta.env.VITE_API_URL || '').trim();

// A configured localhost URL is only valid when the page is actually served from
// localhost. If it leaks into a production build, every browser would try to hit
// its own machine. Fall back to same-origin so the deployed site uses its own
// host (e.g. Netlify `_redirects` -> /.netlify/functions/api).
const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(configured);

const API_URL = configured && (isLocal || !isLocalhostUrl)
  ? configured
  : (isLocal ? 'http://localhost:3006' : window.location.origin);

export default API_URL;
