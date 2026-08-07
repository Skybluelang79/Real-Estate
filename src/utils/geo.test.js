import { describe, it, expect } from 'vitest';
import { haversineDistance, getDirectionsUrl } from '../utils/geo';

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(34.0522, -118.2437, 34.0522, -118.2437)).toBe(0);
  });

  it('computes ~1 degree of latitude as ~69 miles', () => {
    const dist = haversineDistance(0, 0, 1, 0);
    expect(dist).toBeGreaterThan(68);
    expect(dist).toBeLessThan(70);
  });

  it('approximates LA to NYC distance', () => {
    // LA (34.05, -118.24) to NYC (40.71, -74.01) ~ 2440 miles
    const dist = haversineDistance(34.0522, -118.2437, 40.7128, -74.006);
    expect(dist).toBeGreaterThan(2400);
    expect(dist).toBeLessThan(2500);
  });

  it('is symmetric', () => {
    const a = haversineDistance(10, 20, 30, 40);
    const b = haversineDistance(30, 40, 10, 20);
    expect(Math.abs(a - b)).toBeLessThan(0.0001);
  });
});

describe('getDirectionsUrl', () => {
  it('uses address when provided', () => {
    const url = getDirectionsUrl(1, 2, '123 Main St, LA');
    expect(url).toContain('destination=123%20Main%20St%2C%20LA');
  });

  it('uses coordinates when no address', () => {
    const url = getDirectionsUrl(34.05, -118.24);
    expect(url).toContain('destination=34.05,-118.24');
  });
});
