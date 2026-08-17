import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import Footer from './Footer';

vi.mock('../config', () => ({ default: 'http://localhost:3006' }));
vi.mock('./NewsletterSignup', () => ({
  default: () => <form data-testid="newsletter-form" />,
}));

const renderFooter = () =>
  render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );

describe('Footer', () => {
  it('renders without crashing', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('contains the brand name', () => {
    renderFooter();
    expect(screen.getByText('Dream Homes')).toBeInTheDocument();
  });

  it('contains navigation links to expected paths', () => {
    renderFooter();
    const homeLinks = screen.getAllByRole('link').filter(a => a.getAttribute('href') === '/');
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /properties/i })).toHaveAttribute('href', '/properties');
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact');
  });

  it('contains resource links', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: /financing/i })).toHaveAttribute('href', '/financing');
    expect(screen.getByRole('link', { name: /valuation/i })).toHaveAttribute('href', '/valuation');
    expect(screen.getByRole('link', { name: /moving/i })).toHaveAttribute('href', '/moving');
  });

  it('contains contact information', () => {
    renderFooter();
    expect(screen.getByText('123 Dream Street')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles, CA 90001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /info@dreamhomes.com/i })).toHaveAttribute('href', 'mailto:info@dreamhomes.com');
    expect(screen.getByRole('link', { name: /\(800\) 555-HOME/i })).toHaveAttribute('href', 'tel:+18005554663');
  });

  it('contains social media links', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://facebook.com');
    expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute('href', 'https://twitter.com');
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com');
  });

  it('social media links open in new tab', () => {
    renderFooter();
    const fb = screen.getByRole('link', { name: 'Facebook' });
    expect(fb).toHaveAttribute('target', '_blank');
    expect(fb).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('contains copyright text', () => {
    renderFooter();
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });

  it('contains trust badges', () => {
    renderFooter();
    expect(screen.getByText('DRE #01987654')).toBeInTheDocument();
    expect(screen.getByText('MLS Member')).toBeInTheDocument();
    expect(screen.getByText('Equal Housing Opportunity')).toBeInTheDocument();
  });

  it('renders the newsletter form', () => {
    renderFooter();
    expect(screen.getByTestId('newsletter-form')).toBeInTheDocument();
  });
});
