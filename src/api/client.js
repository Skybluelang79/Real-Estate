import API_URL from '../config';

const getToken = () => localStorage.getItem('dreamhomes_token');

async function request(method, url, { body, token, form } = {}) {
  const headers = {};
  if (token !== undefined ? token : getToken()) {
    headers.Authorization = `Bearer ${token !== undefined ? token : getToken()}`;
  }
  if (body && !form) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${url}`, {
      method,
      headers,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error('Network error — is the server running?');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (url, opts) => request('GET', url, opts),
  post: (url, opts) => request('POST', url, opts),
  put: (url, opts) => request('PUT', url, opts),
  del: (url, opts) => request('DELETE', url, opts),
};

export default api;
