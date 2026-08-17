import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Testimonials from './Testimonials';

vi.mock('../config', () => ({ default: 'http://localhost:3006' }));

const mockTestimonials = [
  { id: 1, name: 'Jane Doe', role: 'Homeowner', content: 'Amazing experience!', rating: 5 },
  { id: 2, name: 'John Smith', role: 'Investor', content: 'Great properties.', rating: 4 },
  { id: 3, name: 'Alice Brown', role: 'Buyer', content: 'Very professional team.', rating: 3 },
];

describe('Testimonials', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing when there are no testimonials', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: [] }),
    });
    const { container } = render(<Testimonials />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(container.querySelector('.testimonials-section')).not.toBeInTheDocument();
  });

  it('renders testimonial cards after fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('What Our Clients Say')).toBeInTheDocument();
    });
    expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Homeowner')).toBeInTheDocument();
  });

  it('displays star ratings', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    expect(screen.getByText('★★★★★')).toBeInTheDocument();
  });

  it('shows navigation dots when multiple testimonials', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    const dots = screen.getAllByRole('button').filter((btn) => btn.className.includes('testimonial-dot'));
    expect(dots).toHaveLength(3);
  });

  it('navigates to next testimonial on dot click', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    const dots = screen.getAllByRole('button').filter((btn) => btn.className.includes('testimonial-dot'));
    act(() => {
      dots[1].click();
    });
    expect(screen.getByText('"Great properties."')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('auto-plays to next testimonial after 6 seconds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(screen.getByText('"Great properties."')).toBeInTheDocument();
  });

  it('does not show dots for a single testimonial', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: [mockTestimonials[0]] }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    const dots = screen.queryAllByRole('button').filter((btn) => btn.className.includes('testimonial-dot'));
    expect(dots).toHaveLength(0);
  });

  it('shows author avatar initial', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('wraps around to first after last', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ testimonials: mockTestimonials }),
    });
    render(<Testimonials />);
    await waitFor(() => {
      expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(18000);
    });
    expect(screen.getByText('"Amazing experience!"')).toBeInTheDocument();
  });
});
