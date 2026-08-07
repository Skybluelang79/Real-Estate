import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api from './client';

const API_URL = 'http://localhost:3006';

function stubFetch(mockResolvedValue) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResolvedValue));
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the stored token as a bearer header', async () => {
    localStorage.setItem('dreamhomes_token', 'tok');
    stubFetch(jsonResponse(200, { data: [1] }));

    const data = await api.get('/api/properties');
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/properties`,
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer tok' },
      }),
    );
    expect(data).toEqual({ data: [1] });
  });

  it('sends JSON bodies with content-type on POST', async () => {
    stubFetch(jsonResponse(200, { ok: true }));

    await api.post('/api/auth/login', { body: { email: 'a@b.c', password: 'x' } });
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: 'a@b.c', password: 'x' }),
      }),
    );
  });

  it('allows overriding the token per request', async () => {
    localStorage.setItem('dreamhomes_token', 'stored');
    stubFetch(jsonResponse(200, {}));

    await api.get('/api/admin', { token: 'override' });
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/admin`,
      expect.objectContaining({ headers: { Authorization: 'Bearer override' } }),
    );
  });

  it('returns null for 204 responses', async () => {
    stubFetch({ ok: true, status: 204, json: () => Promise.reject() });
    expect(await api.del('/api/properties/1')).toBeNull();
  });

  it('throws an error with the status for failed requests', async () => {
    stubFetch(jsonResponse(404, { error: 'Not found' }));
    await expect(api.get('/api/properties/999')).rejects.toMatchObject({
      message: 'Not found',
      status: 404,
    });
  });

  it('wraps network failures in a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.get('/api/properties')).rejects.toThrow('Network error');
  });

  it('skips the auth header when there is no token', async () => {
    stubFetch(jsonResponse(200, {}));
    await api.get('/api/properties');
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/properties`,
      expect.objectContaining({ headers: {} }),
    );
  });
});
