import { describe, it, expect } from 'vitest';
import { formatPrice, formatFullPrice, toCurrency } from '../utils/format';

describe('formatPrice', () => {
  it('formats millions as $X.XXM', () => {
    expect(formatPrice(2500000)).toBe('$2.50M');
  });

  it('formats thousands as $XK', () => {
    expect(formatPrice(450000)).toBe('$450K');
  });

  it('formats small values with commas', () => {
    expect(formatPrice(950)).toBe('$950');
    expect(formatPrice(1500)).toBe('$2K');
  });

  it('handles falsy input', () => {
    expect(formatPrice(null)).toBe('$0');
    expect(formatPrice(undefined)).toBe('$0');
    expect(formatPrice(0)).toBe('$0');
  });

  it('strips currency symbols and commas from strings', () => {
    expect(formatPrice('$1,250,000')).toBe('$1.25M');
  });
});

describe('formatFullPrice', () => {
  it('formats full prices with commas', () => {
    expect(formatFullPrice(1250000)).toBe('$1,250,000');
  });

  it('returns N/A for missing values', () => {
    expect(formatFullPrice(null)).toBe('N/A');
    expect(formatFullPrice(undefined)).toBe('N/A');
  });
});

describe('toCurrency', () => {
  it('formats numbers', () => {
    expect(toCurrency(5000)).toBe('$5,000');
  });

  it('returns $0 for invalid values', () => {
    expect(toCurrency(NaN)).toBe('$0');
    expect(toCurrency(null)).toBe('$0');
    expect(toCurrency(undefined)).toBe('$0');
  });
});
