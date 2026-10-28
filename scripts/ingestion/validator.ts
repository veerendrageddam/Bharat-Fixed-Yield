import { SpecialScheme } from './types';

/**
 * Safety Bounds for Indian Bank Deposit Yields:
 * Historically, INR fixed deposit rates from RBI-scheduled banks operate within 3.00% to 11.50%.
 * Any value outside this range indicates an upstream layout change or broken column index.
 */
export const MIN_VALID_RATE = 3.0;
export const MAX_VALID_RATE = 11.5;

export function isValidRate(rate: number | null | undefined): rate is number {
  return (
    typeof rate === 'number' &&
    !isNaN(rate) &&
    rate >= MIN_VALID_RATE &&
    rate <= MAX_VALID_RATE
  );
}

export function parsePercent(text: string): number | null {
  if (!text) return null;
  // Check for percentage pattern e.g. "7.50%", "8.25 %"
  const match = text.match(/(\d+\.?\d*)\s*%/);
  if (match) {
    const val = parseFloat(match[1]);
    return isValidRate(val) ? val : null;
  }
  // Try raw numeric extraction
  const directFloat = parseFloat(text.replace(/[^\d.]/g, ''));
  return isValidRate(directFloat) ? directFloat : null;
}

export function validateRateMatrix(matrix: Record<string, number>): Record<string, number> {
  const clean: Record<string, number> = {};
  for (const [tenure, rate] of Object.entries(matrix)) {
    if (isValidRate(rate)) {
      clean[tenure] = Number(rate.toFixed(2));
    }
  }
  return clean;
}

export function sanitizeSpecialSchemes(schemes: SpecialScheme[]): SpecialScheme[] {
  return schemes
    .filter((s) => s.name && s.days > 0 && isValidRate(s.rate))
    .map((s) => ({
      name: s.name.trim(),
      days: Math.round(s.days),
      rate: Number(s.rate.toFixed(2)),
      ...(s.badge ? { badge: s.badge.trim() } : {}),
      ...(typeof s.seniorBonus === 'number' ? { seniorBonus: s.seniorBonus } : {}),
      ...(typeof s.superSeniorBonus === 'number' ? { superSeniorBonus: s.superSeniorBonus } : {}),
    }));
}

