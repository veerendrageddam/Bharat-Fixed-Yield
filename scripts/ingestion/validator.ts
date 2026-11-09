import { SpecialScheme } from './types';

/**
 * Safety Bounds for Indian Bank Deposit Yields:
 * Historically, INR fixed deposit rates from RBI-scheduled banks operate within 3.00% to 9.50%.
 * Any retail FD rate above 9.50% in India is almost certainly an MCLR, lending, or advance rate.
 */
export const MIN_VALID_RATE = 3.0;
export const MAX_VALID_RATE = 9.5;

/**
 * Category-Specific Interest Rate Ceilings:
 * Prevents non-deposit tables (MCLR, EBLR, personal loan rates) from corrupting deposit data.
 */
export const CATEGORY_RATE_CEILINGS: Record<string, number> = {
  psu: 7.75,         // PSU banks peak at ~7.25% - 7.40%
  private: 8.25,     // Private commercial banks peak at ~7.25% - 7.90% (IDFC 500D)
  sfb: 9.25,         // Small Finance Banks peak at ~8.40% - 9.00% (Unity Shrestha)
  rrb: 7.75,         // Regional Rural Banks peak at ~7.25% - 7.50%
  post_office: 7.75, // India Post POTD peak at 7.50%
};

export function isValidRate(rate: number | null | undefined, category?: string): rate is number {
  if (typeof rate !== 'number' || isNaN(rate)) return false;
  const maxCeiling = category && CATEGORY_RATE_CEILINGS[category]
    ? CATEGORY_RATE_CEILINGS[category]
    : MAX_VALID_RATE;
  return rate >= MIN_VALID_RATE && rate <= maxCeiling;
}

/**
 * Anomaly / Volatility Circuit Breaker:
 * In the Indian banking system, deposit rates change in increments of 0.05% - 0.25%.
 * Any sudden change > 0.75% indicates upstream layout churn or non-deposit table pollution.
 */
export function isRateAnomaly(newRate: number, oldRate: number, maxAllowedDelta: number = 0.75): boolean {
  if (!oldRate || oldRate <= 0) return false;
  return Math.abs(newRate - oldRate) > maxAllowedDelta;
}

export function parsePercent(text: string, category?: string): number | null {
  if (!text) return null;
  // Check for percentage pattern e.g. "7.50%", "8.25 %"
  const match = text.match(/(\d+\.?\d*)\s*%/);
  if (match) {
    const val = parseFloat(match[1]);
    return isValidRate(val, category) ? val : null;
  }
  // Try raw numeric extraction
  const directFloat = parseFloat(text.replace(/[^\d.]/g, ''));
  return isValidRate(directFloat, category) ? directFloat : null;
}

export function validateRateMatrix(matrix: Record<string, number>, category?: string): Record<string, number> {
  const clean: Record<string, number> = {};
  for (const [tenure, rate] of Object.entries(matrix)) {
    if (isValidRate(rate, category)) {
      clean[tenure] = Number(rate.toFixed(2));
    }
  }
  return clean;
}

export function sanitizeSpecialSchemes(schemes: SpecialScheme[], category?: string): SpecialScheme[] {
  return schemes
    .filter((s) => s.name && s.days > 0 && isValidRate(s.rate, category))
    .map((s) => ({
      name: s.name.trim(),
      days: Math.round(s.days),
      rate: Number(s.rate.toFixed(2)),
      ...(s.badge ? { badge: s.badge.trim() } : {}),
      ...(typeof s.seniorBonus === 'number' ? { seniorBonus: s.seniorBonus } : {}),
      ...(typeof s.superSeniorBonus === 'number' ? { superSeniorBonus: s.superSeniorBonus } : {}),
    }));
}

