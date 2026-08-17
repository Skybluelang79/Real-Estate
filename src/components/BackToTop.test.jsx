import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import BackToTop from './BackToTop';

describe('BackToTop', () => {
  let scrollY = 0;

  beforeEach(() => {
    scrollY = 0;
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollY,
      configurable: true,
    });
    window.scrollTo = vi.fn(({ top }) => {
      scrollY = top;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when scroll is at top', () => {
    render(<BackToTop />);
    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();
  });

  it('appears after scrolling past 400px', () => {
    render(<BackToTop />);
    act(() => {
      scrollY = 500;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<BackToTop />);
    act(() => {
      scrollY = 500;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('button', { name: /back to top/i })).toHaveAttribute('aria-label', 'Back to top');
  });

  it('scrolls to top when clicked', () => {
    render(<BackToTop />);
    act(() => {
      scrollY = 500;
      window.dispatchEvent(new Event('scroll'));
    });
    act(() => {
      screen.getByRole('button', { name: /back to top/i }).click();
    });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('hides again when scrolled back below 400px', () => {
    render(<BackToTop />);
    act(() => {
      scrollY = 500;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();

    act(() => {
      scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();
  });
});
