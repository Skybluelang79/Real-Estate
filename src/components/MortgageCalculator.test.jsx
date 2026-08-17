import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MortgageCalculator from './MortgageCalculator';

vi.mock('../config', () => ({ default: 'http://localhost:3006' }));

const defaultProps = { isOpen: true, onClose: vi.fn() };

describe('MortgageCalculator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<MortgageCalculator isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Mortgage Calculator')).not.toBeInTheDocument();
  });

  it('renders the calculator form when open', () => {
    render(<MortgageCalculator {...defaultProps} />);
    expect(screen.getByText('Mortgage Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText(/home price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan term/i)).toBeInTheDocument();
  });

  it('has default values pre-filled', () => {
    render(<MortgageCalculator {...defaultProps} />);
    expect(screen.getByLabelText(/home price/i)).toHaveValue(500000);
    expect(screen.getByLabelText(/down payment/i)).toHaveValue(100000);
    expect(screen.getByLabelText(/interest rate/i)).toHaveValue(6.5);
    expect(screen.getByLabelText(/loan term/i)).toHaveValue('30');
  });

  it('calculates monthly payment on button click', () => {
    render(<MortgageCalculator {...defaultProps} />);
    fireEvent.click(screen.getByText('Calculate'));
    expect(screen.getByText('Monthly Payment')).toBeInTheDocument();
    expect(screen.getByText('Total Interest')).toBeInTheDocument();
    expect(screen.getByText('Total Payment')).toBeInTheDocument();
  });

  it('shows results with dollar amounts', () => {
    render(<MortgageCalculator {...defaultProps} />);
    fireEvent.click(screen.getByText('Calculate'));
    const monthly = screen.getByText('Monthly Payment').closest('.mortgage-result-item').querySelector('.result-value');
    expect(monthly.textContent).toMatch(/^\$/);
  });

  it('shows error when home price is zero', () => {
    render(<MortgageCalculator {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/home price/i), { target: { value: 0 } });
    fireEvent.click(screen.getByText('Calculate'));
    expect(screen.getByText(/home price greater than \$0/i)).toBeInTheDocument();
  });

  it('shows error when down payment exceeds home price', () => {
    render(<MortgageCalculator {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/down payment/i), { target: { value: 600000 } });
    fireEvent.click(screen.getByText('Calculate'));
    expect(screen.getByText(/Down payment must be between/i)).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<MortgageCalculator isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Mortgage Calculator').closest('.modal-content').parentElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<MortgageCalculator isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close mortgage calculator/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<MortgageCalculator isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('prevents modal content click from closing', () => {
    const onClose = vi.fn();
    render(<MortgageCalculator isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close mortgage calculator/i }).closest('.modal-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows changing loan term', () => {
    render(<MortgageCalculator {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/loan term/i), { target: { value: '15' } });
    expect(screen.getByLabelText(/loan term/i)).toHaveValue('15');
    fireEvent.click(screen.getByText('Calculate'));
    expect(screen.getByText('Monthly Payment')).toBeInTheDocument();
  });
});
