import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function Consumer() {
  const { darkMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="dark">{String(darkMode)}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark');
  });

  it('defaults to light mode', () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('respects a stored dark preference', () => {
    localStorage.setItem('dreamhomes_theme', 'dark');
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.body.classList.contains('dark')).toBe(true);
  });

  it('toggles theme and persists the choice', () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('dreamhomes_theme')).toBe('dark');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('dark').textContent).toBe('false');
    expect(localStorage.getItem('dreamhomes_theme')).toBe('light');
  });

  it('throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
    spy.mockRestore();
  });
});
