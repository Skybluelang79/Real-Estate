const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const configured = (import.meta.env.VITE_API_URL || '').trim();

// A configured localhost URL is only valid when the page is actually served from
// localhost. If it leaks into a production build, every browser would try to hit
// its own machine. On Netlify, call the serverless function directly to avoid
// redirect/CORS issues. Locally, use the Express dev server.
const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(configured);

let API_URL;
if (configured && (isLocal || !isLocalhostUrl)) {
  API_URL = configured;
} else if (isLocal) {
  API_URL = 'http://localhost:3006';
} else {
  // Production: call Netlify Functions directly — no redirect needed
  API_URL = `${window.location.origin}/.netlify/functions/api`;
}

export default API_URL;
