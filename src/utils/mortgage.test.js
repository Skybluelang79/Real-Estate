import { describe, it, expect } from 'vitest';
import { calculateMortgage, parsePriceInput } from '../utils/mortgage';

describe('calculateMortgage', () => {
  it('computes a standard 30-year fixed loan', () => {
    // $500k home, $100k down, 6.5%, 30yr -> ~$2,529 monthly
    const r = calculateMortgage({ homePrice: 500000, downPayment: 100000, interestRate: 6.5, loanTerm: 30 });
    expect(Number(r.monthly)).toBeGreaterThan(2500);
    expect(Number(r.monthly)).toBeLessThan(2600);
    expect(Number(r.totalPayment)).toBeGreaterThan(Number(r.monthly) * 359);
    expect(Number(r.totalInterest)).toBeGreaterThan(0);
  });

  it('handles 0% interest with principal-only split', () => {
    const r = calculateMortgage({ homePrice: 120000, downPayment: 20000, interestRate: 0, loanTerm: 10 });
    expect(Number(r.monthly)).toBeCloseTo(833.33, 0);
    expect(r.totalInterest).toBe('0.00');
    expect(r.totalPayment).toBe('100000.00');
  });

  it('handles 0 down payment', () => {
    const r = calculateMortgage({ homePrice: 200000, downPayment: 0, interestRate: 6, loanTerm: 30 });
    expect(Number(r.monthly)).toBeGreaterThan(1000);
  });

  it('returns string-formatted values', () => {
    const r = calculateMortgage({ homePrice: 300000, downPayment: 60000, interestRate: 5, loanTerm: 15 });
    expect(typeof r.monthly).toBe('string');
    expect(r.monthly).toMatch(/^\d+\.\d{2}$/);
  });
});

describe('parsePriceInput', () => {
  it('parses plain numbers', () => {
    expect(parsePriceInput('450000')).toBe(450000);
  });

  it('strips currency symbols and commas', () => {
    expect(parsePriceInput('$1,250,000')).toBe(1250000);
  });

  it('strips spaces', () => {
    expect(parsePriceInput('1 250 000')).toBe(1250000);
  });

  it('returns 0 for invalid input', () => {
    expect(parsePriceInput('abc')).toBe(0);
    expect(parsePriceInput('')).toBe(0);
    expect(parsePriceInput('-5')).toBe(0);
  });
});
