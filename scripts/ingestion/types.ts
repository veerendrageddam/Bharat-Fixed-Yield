/**
 * Bharat Fixed Yield (BFY) - Rate Ingestion Contracts & Types
 * Follows SOLID principles with decoupled interfaces for adapters, validators, and storage.
 */

export type RateVerificationStatus =
  | 'live_synced'
  | 'official_gazette'
  | 'circular_verified'
  | 'baseline_verified'
  | 'fetch_failed'
  | 'stale';

export interface SpecialScheme {
  name: string;
  days: number;
  rate: number;
  badge?: string;
  seniorBonus?: number;
  superSeniorBonus?: number;
}

export interface BankRateData {
  baseRate: number;
  ratesByTenure: Record<string, number>;
  rdRatesByTenure?: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus: number;
  superSeniorBonus: number;
  womenBonus: number;
  sourceUrl?: string;
  circularUrl?: string;
  effectiveDate?: string;
  callable?: boolean;
  retailCapCr?: number;
  lastVerified?: string;
  verificationStatus?: RateVerificationStatus;
}

export interface MergedBankInfo {
  id: string;
  name: string;
  status: 'amalgamated';
  category: 'sfb' | 'private' | 'psu' | 'rrb' | 'post_office';
  effectiveDate: string;
  rationale: string;
  successorBankIds: string[];
  successorBankNames: string[];
  notice: string;
  formerOperatingStates: string[];
  sourceNotice?: string;
}

export interface BankMasterDefinition {
  id: string;
  rank: number;
  name: string;
  subTitle: string;
  category: 'sfb' | 'private' | 'psu' | 'rrb' | 'post_office';
  sponsorGovt?: string;
  badge: string;
  categoryTag: string;
  ratingAgency: 'CRISIL' | 'CARE' | 'ICRA' | 'Sovereign';
  rating: string;
  logoUrl: string;
  minDeposit: number;
  tenureYears: number;
  tenureMonths: number;
  dicgcCovered: boolean;
  notes: string;
  exitPenalty: string;
  lockInDays: number;
  isPanIndia: boolean;
  operatingStates: string[];
  portalUrl: string;
  portalName: string;
  fdSupported?: boolean;
  rdSupported: boolean;
  status: 'active';
  baseRate: number;
  ratesByTenure: Record<string, number>;
  rdRatesByTenure?: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus: number;
  superSeniorBonus: number;
  womenBonus: number;
  sourceUrl?: string;
  circularUrl?: string;
  effectiveDate?: string;
  callable?: boolean;
  retailCapCr?: number;
  lastVerified?: string;
  verificationStatus?: RateVerificationStatus;
}

export interface RatesFile {
  lastUpdated: string;
  version: string;
  source: string;
  banks: Record<string, BankMasterDefinition>;
  mergedBanks: Record<string, MergedBankInfo>;
  rates: Record<string, BankRateData>;
}

export interface ScrapedRateResult {
  baseRate?: number;
  ratesByTenure?: Record<string, number>;
  rdRatesByTenure?: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus?: number;
  superSeniorBonus?: number;
  womenBonus?: number;
  sourceUrl?: string;
  circularUrl?: string;
  effectiveDate?: string;
  callable?: boolean;
  retailCapCr?: number;
  lastVerified?: string;
  verificationStatus?: RateVerificationStatus;
}

/**
 * BankRateAdapter Interface (Adapter / Strategy Pattern)
 * Each bank or category-specific scraper implements this interface.
 */
export interface BankRateAdapter {
  readonly bankId: string;
  readonly bankName: string;
  readonly sourceUrl: string;
  readonly category: 'sfb' | 'rrb' | 'psu' | 'private' | 'post_office';
  fetchRates(): Promise<ScrapedRateResult | null>;
}

export interface IngestionReportItem {
  bankId: string;
  bankName: string;
  category: string;
  status: RateVerificationStatus;
  baseRate: number;
  diffNotes: string[];
  lastVerified: string;
}

export interface IngestionSummary {
  timestamp: string;
  totalActiveBanks: number;
  liveSyncedCount: number;
  verifiedIdenticalCount: number;
  preservedBaselineCount: number;
  failedCount: number;
  changesDetected: number;
  reportItems: IngestionReportItem[];
}

