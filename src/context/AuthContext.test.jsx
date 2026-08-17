import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthCtx';

const TOKEN = 'tok123';
const USER = { id: 1, name: 'Ada', email: 'ada@example.com' };
const API_URL = 'http://localhost:3006';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function mockFetchOnce(status, body) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts unauthenticated and not loading when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('hydrates a stored session and validates it with the /me endpoint', async () => {
    localStorage.setItem('dreamhomes_token', TOKEN);
    localStorage.setItem('dreamhomes_user', JSON.stringify(USER));
    const refreshed = { id: 1, name: 'Ada Lovelace', email: USER.email };
    const fetchMock = mockFetchOnce(200, { user: refreshed });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/auth/me`,
      expect.objectContaining({ headers: { Authorization: `Bearer ${TOKEN}` } }),
    );
    expect(result.current.user).toEqual(refreshed);
    expect(JSON.parse(localStorage.getItem('dreamhomes_user'))).toEqual(refreshed);
  });

  it('clears the session when the stored token is rejected', async () => {
    localStorage.setItem('dreamhomes_token', TOKEN);
    localStorage.setItem('dreamhomes_user', JSON.stringify(USER));
    vi.stubGlobal('fetch', mockFetchOnce(401, { error: 'Session expired' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('dreamhomes_token')).toBeNull();
    expect(localStorage.getItem('dreamhomes_user')).toBeNull();
  });

  it('logs in, stores the session and exposes the user', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { token: TOKEN, user: USER }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('ada@example.com', 'secret');
    });
    expect(result.current.user).toEqual(USER);
    expect(result.current.token).toBe(TOKEN);
    expect(localStorage.getItem('dreamhomes_token')).toBe(TOKEN);
    expect(JSON.parse(localStorage.getItem('dreamhomes_user'))).toEqual(USER);
  });

  it('throws a readable error when login fails', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(400, { message: 'Invalid credentials' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(() => result.current.login('ada@example.com', 'wrong')),
    ).rejects.toThrow('Invalid credentials');
    expect(result.current.user).toBeNull();
  });

  it('clears the session on logout', async () => {
    localStorage.setItem('dreamhomes_token', TOKEN);
    localStorage.setItem('dreamhomes_user', JSON.stringify(USER));
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('dreamhomes_token')).toBeNull();
  });
});
