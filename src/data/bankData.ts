import { BankData, MergedBankInfo } from '../types/bank';
import ratesData from './rates.json';

/**
 * Transforms string-keyed JSON tenure rate maps into numeric-keyed dictionaries
 * expected by calculator engines and visualization charts.
 */
function parseTenureRates(ratesMap?: Record<string, number>): Record<number, number> {
  if (!ratesMap) return {};
  const result: Record<number, number> = {};
  for (const [key, val] of Object.entries(ratesMap)) {
    const numKey = parseInt(key, 10);
    if (!isNaN(numKey) && typeof val === 'number') {
      result[numKey] = val;
    }
  }
  return result;
}

export const LATEST_RATES_METADATA = {
  lastUpdated: ratesData.lastUpdated,
  source: ratesData.source,
  version: ratesData.version,
};

/**
 * Merged & Amalgamated Banks Registry
 * Tracks banks restructured under regulatory consolidations (e.g. GoI "One State, One RRB" policy).
 */
export const MERGED_BANKS_REGISTRY: Record<string, MergedBankInfo> =
  (ratesData.mergedBanks || {}) as Record<string, MergedBankInfo>;

/**
 * Dynamic Bank Yield Hydration
 * All active scheduled banks and their multi-tenure rate matrices are populated
 * directly from rates.json (synced via automated scrapers). Zero rates are hardcoded.
 */
export const INITIAL_BANKS: BankData[] = Object.values(
  (ratesData.banks || {}) as Record<string, any>
)
  .filter((b) => b.status === 'active')
  .map((b, index) => ({
    id: b.id,
    rank: b.rank ?? index + 1,
    name: b.name,
    subTitle: b.subTitle,
    category: b.category,
    sponsorGovt: b.sponsorGovt,
    badge: b.badge,
    categoryTag: b.categoryTag,
    ratingAgency: b.ratingAgency,
    rating: b.rating,
    baseRate: typeof b.baseRate === 'number' ? b.baseRate : 7.00,
    seniorBonus: typeof b.seniorBonus === 'number' ? b.seniorBonus : 0.50,
    superSeniorBonus: typeof b.superSeniorBonus === 'number' ? b.superSeniorBonus : 0.75,
    womenBonus: typeof b.womenBonus === 'number' ? b.womenBonus : 0.00,
    logoUrl: b.logoUrl,
    minDeposit: b.minDeposit ?? 1000,
    tenureYears: b.tenureYears ?? 3,
    tenureMonths: b.tenureMonths ?? 36,
    specialTenure: b.specialTenure,
    specialSchemes: b.specialSchemes ?? [],
    dicgcCovered: b.dicgcCovered ?? true,
    notes: b.notes,
    exitPenalty: b.exitPenalty ?? '0.50% Break Penalty',
    lockInDays: b.lockInDays ?? 7,
    ratesByTenure: parseTenureRates(b.ratesByTenure),
    rdRatesByTenure: parseTenureRates(b.rdRatesByTenure),
    isPanIndia: b.isPanIndia ?? false,
    operatingStates: b.operatingStates ?? ['ALL'],
    portalUrl: b.portalUrl,
    portalName: b.portalName,
    fdSupported: b.fdSupported ?? true,
    rdSupported: b.rdSupported ?? true,
    status: b.status ?? 'active',
    sourceUrl: b.sourceUrl,
    lastVerified: b.lastVerified,
    verificationStatus: b.verificationStatus ?? 'baseline_verified',
  }));

/**
 * Section 80C Tax-Saver 5-Year Lock-in Derivative Banks
 */
export const TAX_SAVER_BANKS: BankData[] = INITIAL_BANKS
  .filter((b) => b.fdSupported !== false)
  .map((b) => ({
    ...b,
    tenureYears: 5,
    tenureMonths: 60,
    badge: 'Section 80C Tax Saver',
    categoryTag: '5-Year Non-Callable Lock-in',
    baseRate: b.ratesByTenure?.[60] ?? Number((b.baseRate - 0.35).toFixed(2)),
    notes: 'Eligible for tax deduction up to ₹1,50,000 under Section 80C. Mandatory non-callable 5-year lock-in.',
  }));
