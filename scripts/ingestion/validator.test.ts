import { describe, it, expect } from 'vitest';
import {
  isValidRate,
  parsePercent,
  validateRateMatrix,
  sanitizeSpecialSchemes,
} from './validator';

describe('Rate Ingestion Validator & Financial Sanity Suite', () => {
  it('validates interest rate safety bounds (3.00% to 11.50%)', () => {
    expect(isValidRate(3.0)).toBe(true);
    expect(isValidRate(7.5)).toBe(true);
    expect(isValidRate(8.4)).toBe(true);
    expect(isValidRate(11.5)).toBe(true);

    // Out of bounds / Corrupted rates
    expect(isValidRate(2.99)).toBe(false);
    expect(isValidRate(11.51)).toBe(false);
    expect(isValidRate(-1)).toBe(false);
    expect(isValidRate(NaN)).toBe(false);
    expect(isValidRate(null as any)).toBe(false);
    expect(isValidRate(undefined as any)).toBe(false);
  });

  it('parses formatted percent strings cleanly', () => {
    expect(parsePercent('7.50%')).toBe(7.5);
    expect(parsePercent('  8.15 %  ')).toBe(8.15);
    expect(parsePercent('Peak SFB Yield 8.40% p.a.')).toBe(8.4);
    expect(parsePercent('Special 7.25%')).toBe(7.25);
    expect(parsePercent('No rate here')).toBe(null);
    expect(parsePercent('15.00%')).toBe(null); // exceeds 11.5% ceiling
    expect(parsePercent('1.25%')).toBe(null); // below 3.0% floor
  });

  it('validates and rounds rate matrix dictionaries', () => {
    const rawMatrix = {
      '12': 7.254,
      '24': 8.001,
      '36': 2.50, // invalid low rate
      '60': 15.00, // invalid high rate
    };
    const cleaned = validateRateMatrix(rawMatrix);
    expect(cleaned).toEqual({
      '12': 7.25,
      '24': 8.00,
    });
    expect(cleaned['36']).toBeUndefined();
    expect(cleaned['60']).toBeUndefined();
  });

  it('sanitizes and filters special schemes', () => {
    const rawSchemes = [
      { name: 'Unity Shrestha', days: 1001, rate: 8.40, badge: 'Peak SFB' },
      { name: 'Broken Scheme', days: -10, rate: 8.00 },
      { name: 'Corrupted Scheme', days: 444, rate: 1.50 },
      { name: '  444-DDD Special  ', days: 444.2, rate: 7.404 },
    ];
    const sanitized = sanitizeSpecialSchemes(rawSchemes);
    expect(sanitized).toHaveLength(2);
    expect(sanitized[0]).toEqual({
      name: 'Unity Shrestha',
      days: 1001,
      rate: 8.4,
      badge: 'Peak SFB',
    });
    expect(sanitized[1]).toEqual({
      name: '444-DDD Special',
      days: 444,
      rate: 7.4,
    });
  });
});

