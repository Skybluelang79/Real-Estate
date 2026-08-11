const configured = (import.meta.env.VITE_API_URL || '').trim();
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = configured || (isLocal ? 'http://localhost:3006' : window.location.origin);

export default API_URL;
