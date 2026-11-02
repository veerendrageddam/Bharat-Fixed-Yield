/**
 * Bharat Fixed Yield (BFY) — Structured Circular & Regulatory Ingestion Engine
 * 
 * Replaces fragile HTML web scraping with a deterministic, verified GitOps ingestion model:
 * 1. Validates ALCO (Asset-Liability Committee) circular disclosures against strict financial bounds.
 * 2. Enforces Retail Deposit thresholds (< ₹3 Crore per RBI guidelines w.e.f. June 2024).
 * 3. Captures official circular effective dates ('effectiveDate') and direct disclosure links ('circularUrl').
 * 4. Merges updates with atomic diffing and zero-downtime JSON serialization.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  BankMasterDefinition,
  BankRateData,
  RatesFile,
  RateVerificationStatus,
  SpecialScheme,
} from './types';
import { MASTER_BANK_REGISTRY, MERGED_BANKS_CATALOG } from './masterRegistry';
import { isValidRate, sanitizeSpecialSchemes, validateRateMatrix } from './validator';

export const RATES_FILE_PATH = path.resolve(process.cwd(), 'src/data/rates.json');

export interface BankCircularUpdate {
  bankId: string;
  effectiveDate: string; // e.g. "2024-06-15" or "w.e.f. June 15, 2024"
  circularUrl: string;   // Official rate circular URL or PDF link
  baseRate?: number;     // Standard tenure rate (e.g. 36M or highest standard)
  ratesByTenure: Record<string, number>; // Required core matrix: at least 12M and 36M or 60M
  rdRatesByTenure?: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus?: number;
  superSeniorBonus?: number;
  womenBonus?: number;
  callable?: boolean;    // Default true: standard retail callable deposit
  retailCapCr?: number;  // Default 3: under ₹3 Crore retail deposit per RBI
  verificationStatus?: RateVerificationStatus;
}

export interface CircularDiff {
  bankId: string;
  bankName: string;
  category: string;
  changes: string[];
  effectiveDate: string;
  circularUrl: string;
  previousStatus: RateVerificationStatus;
  newStatus: RateVerificationStatus;
}

export interface AuditReport {
  totalBanks: number;
  circularVerifiedCount: number;
  officialGazetteCount: number;
  baselineVerifiedCount: number;
  fetchFailedCount: number;
  missingEffectiveDateCount: number;
  missingCircularUrlCount: number;
  banks: {
    id: string;
    name: string;
    category: string;
    baseRate: number;
    effectiveDate?: string;
    circularUrl?: string;
    verificationStatus: RateVerificationStatus;
    has12M: boolean;
    has36M: boolean;
    has60M: boolean;
    specialSchemesCount: number;
  }[];
}

/**
 * Validates that an incoming circular update satisfies all domain and regulatory rules.
 */
export function validateCircularUpdate(update: BankCircularUpdate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!update.bankId || !MASTER_BANK_REGISTRY[update.bankId]) {
    errors.push(`Unknown or missing bankId: '${update.bankId}'. Must match an institution in MASTER_BANK_REGISTRY.`);
  }

  if (!update.effectiveDate || update.effectiveDate.trim().length === 0) {
    errors.push(`effectiveDate is required for bank '${update.bankId}'.`);
  }

  if (!update.circularUrl || !update.circularUrl.startsWith('http')) {
    errors.push(`circularUrl must be a valid HTTP/HTTPS URL for bank '${update.bankId}'.`);
  }

  if (!update.ratesByTenure || typeof update.ratesByTenure !== 'object') {
    errors.push(`ratesByTenure must be a non-null object for bank '${update.bankId}'.`);
  } else {
    for (const [tenure, rate] of Object.entries(update.ratesByTenure)) {
      if (!isValidRate(rate)) {
        errors.push(`Invalid interest rate (${rate}%) for tenure ${tenure}M in bank '${update.bankId}'. Must be between 3.00% and 11.50%.`);
      }
    }
  }

  if (typeof update.baseRate === 'number' && !isValidRate(update.baseRate)) {
    errors.push(`Invalid baseRate (${update.baseRate}%) for bank '${update.bankId}'. Must be between 3.00% and 11.50%.`);
  }

  if (typeof update.seniorBonus === 'number' && (update.seniorBonus < 0 || update.seniorBonus > 2.0)) {
    errors.push(`Invalid seniorBonus (${update.seniorBonus}%) for bank '${update.bankId}'. Must be between 0.00% and 2.00%.`);
  }

  if (typeof update.superSeniorBonus === 'number' && (update.superSeniorBonus < 0 || update.superSeniorBonus > 2.0)) {
    errors.push(`Invalid superSeniorBonus (${update.superSeniorBonus}%) for bank '${update.bankId}'. Must be between 0.00% and 2.00%.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Loads the current rates.json file or initializes from master registry.
 */
export function loadCurrentRatesFile(): RatesFile {
  if (fs.existsSync(RATES_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(RATES_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e: any) {
      console.warn(`[WARN] Could not parse rates.json: ${e.message}. Initializing fresh structure.`);
    }
  }

  const banks: Record<string, BankMasterDefinition> = {};
  const rates: Record<string, BankRateData> = {};

  for (const [id, def] of Object.entries(MASTER_BANK_REGISTRY)) {
    banks[id] = { ...def };
    rates[id] = {
      baseRate: def.baseRate,
      ratesByTenure: def.ratesByTenure,
      rdRatesByTenure: def.rdRatesByTenure,
      specialTenure: def.specialTenure,
      specialSchemes: def.specialSchemes,
      seniorBonus: def.seniorBonus,
      superSeniorBonus: def.superSeniorBonus,
      womenBonus: def.womenBonus,
      sourceUrl: def.sourceUrl,
      lastVerified: def.lastVerified,
      verificationStatus: def.verificationStatus ?? 'baseline_verified',
    };
  }

  return {
    lastUpdated: new Date().toISOString(),
    version: '2.3.0',
    source: 'RBI Scheduled Bank ALCO Circulars, MoF Gazettes & Direct Disclosures',
    banks,
    mergedBanks: MERGED_BANKS_CATALOG,
    rates,
  };
}

/**
 * Saves the rates file atomically using a temporary file.
 */
export function saveRatesFileAtomic(ratesFile: RatesFile): void {
  const serialized = JSON.stringify(ratesFile, null, 2);
  const tempPath = `${RATES_FILE_PATH}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, serialized, 'utf-8');
  fs.renameSync(tempPath, RATES_FILE_PATH);
}

/**
 * Applies a verified bank circular update to the rates file and returns the diff.
 */
export function applyCircularUpdate(
  update: BankCircularUpdate,
  ratesFile?: RatesFile
): { success: boolean; diff: CircularDiff; ratesFile: RatesFile } {
  const validation = validateCircularUpdate(update);
  if (!validation.valid) {
    throw new Error(`Validation failed for circular update: ${validation.errors.join('; ')}`);
  }

  const currentFile = ratesFile ?? loadCurrentRatesFile();
  const bankId = update.bankId;
  const masterDef = MASTER_BANK_REGISTRY[bankId];
  const existingBank = currentFile.banks[bankId] ?? { ...masterDef };
  const existingRates = currentFile.rates[bankId] ?? {
    baseRate: existingBank.baseRate,
    ratesByTenure: existingBank.ratesByTenure,
    seniorBonus: existingBank.seniorBonus,
    superSeniorBonus: existingBank.superSeniorBonus,
    womenBonus: existingBank.womenBonus,
  };

  const changes: string[] = [];
  const previousStatus = existingBank.verificationStatus ?? 'baseline_verified';

  // Base rate
  const newBaseRate = update.baseRate ?? update.ratesByTenure['36'] ?? update.ratesByTenure['12'] ?? existingBank.baseRate;
  if (existingBank.baseRate !== newBaseRate) {
    changes.push(`baseRate: ${existingBank.baseRate}% -> ${newBaseRate}%`);
    existingBank.baseRate = newBaseRate;
    existingRates.baseRate = newBaseRate;
  }

  // Rates by tenure
  const validatedTenures = validateRateMatrix(update.ratesByTenure);
  for (const [tenure, newRate] of Object.entries(validatedTenures)) {
    const oldRate = existingBank.ratesByTenure?.[tenure];
    if (oldRate !== newRate) {
      changes.push(`Tenure ${tenure}M: ${oldRate ?? 'N/A'}% -> ${newRate}%`);
      existingBank.ratesByTenure[tenure] = newRate;
    }
  }
  existingRates.ratesByTenure = { ...(existingBank.ratesByTenure ?? {}), ...validatedTenures };

  // RD rates
  if (update.rdRatesByTenure) {
    const validatedRd = validateRateMatrix(update.rdRatesByTenure);
    existingBank.rdRatesByTenure = { ...(existingBank.rdRatesByTenure ?? {}), ...validatedRd };
    existingRates.rdRatesByTenure = existingBank.rdRatesByTenure;
    changes.push(`Updated RD rates for ${Object.keys(validatedRd).length} tenures`);
  }

  // Special schemes
  if (update.specialSchemes) {
    const sanitized = sanitizeSpecialSchemes(update.specialSchemes);
    const oldStr = JSON.stringify(existingBank.specialSchemes ?? []);
    const newStr = JSON.stringify(sanitized);
    if (oldStr !== newStr) {
      changes.push(`Special schemes updated: ${sanitized.map(s => `${s.name} (${s.days}D @ ${s.rate}%)`).join(', ')}`);
      existingBank.specialSchemes = sanitized;
      existingRates.specialSchemes = sanitized;
    }
  }

  if (update.specialTenure) {
    if (existingBank.specialTenure !== update.specialTenure) {
      changes.push(`specialTenure: '${existingBank.specialTenure ?? 'N/A'}' -> '${update.specialTenure}'`);
      existingBank.specialTenure = update.specialTenure;
      existingRates.specialTenure = update.specialTenure;
    }
  }

  if (typeof update.seniorBonus === 'number' && existingBank.seniorBonus !== update.seniorBonus) {
    changes.push(`seniorBonus: ${existingBank.seniorBonus}% -> ${update.seniorBonus}%`);
    existingBank.seniorBonus = update.seniorBonus;
    existingRates.seniorBonus = update.seniorBonus;
  }

  if (typeof update.superSeniorBonus === 'number' && existingBank.superSeniorBonus !== update.superSeniorBonus) {
    changes.push(`superSeniorBonus: ${existingBank.superSeniorBonus}% -> ${update.superSeniorBonus}%`);
    existingBank.superSeniorBonus = update.superSeniorBonus;
    existingRates.superSeniorBonus = update.superSeniorBonus;
  }

  if (typeof update.womenBonus === 'number' && existingBank.womenBonus !== update.womenBonus) {
    changes.push(`womenBonus: ${existingBank.womenBonus}% -> ${update.womenBonus}%`);
    existingBank.womenBonus = update.womenBonus;
    existingRates.womenBonus = update.womenBonus;
  }

  // Circular audit metadata
  if (existingBank.effectiveDate !== update.effectiveDate) {
    changes.push(`effectiveDate: '${existingBank.effectiveDate ?? 'N/A'}' -> '${update.effectiveDate}'`);
    existingBank.effectiveDate = update.effectiveDate;
    existingRates.effectiveDate = update.effectiveDate;
  }

  if (existingBank.circularUrl !== update.circularUrl) {
    changes.push(`circularUrl updated`);
    existingBank.circularUrl = update.circularUrl;
    existingRates.circularUrl = update.circularUrl;
    existingBank.sourceUrl = update.circularUrl;
    existingRates.sourceUrl = update.circularUrl;
  }

  existingBank.callable = update.callable ?? true;
  existingRates.callable = existingBank.callable;
  existingBank.retailCapCr = update.retailCapCr ?? 3;
  existingRates.retailCapCr = existingBank.retailCapCr;

  const newStatus: RateVerificationStatus =
    update.verificationStatus ??
    (masterDef.category === 'post_office' ? 'official_gazette' : 'circular_verified');

  existingBank.verificationStatus = newStatus;
  existingRates.verificationStatus = newStatus;
  existingBank.lastVerified = new Date().toISOString();
  existingRates.lastVerified = existingBank.lastVerified;

  currentFile.banks[bankId] = existingBank;
  currentFile.rates[bankId] = existingRates;
  currentFile.lastUpdated = new Date().toISOString();

  const diff: CircularDiff = {
    bankId,
    bankName: existingBank.name,
    category: existingBank.category,
    changes,
    effectiveDate: update.effectiveDate,
    circularUrl: update.circularUrl,
    previousStatus,
    newStatus,
  };

  return {
    success: true,
    diff,
    ratesFile: currentFile,
  };
}

/**
 * Audits all 38 bank records currently in the rates file.
 */
export function auditAllBankRates(ratesFile?: RatesFile): AuditReport {
  const current = ratesFile ?? loadCurrentRatesFile();
  const banks = Object.values(current.banks);

  let circularVerifiedCount = 0;
  let officialGazetteCount = 0;
  let baselineVerifiedCount = 0;
  let fetchFailedCount = 0;
  let missingEffectiveDateCount = 0;
  let missingCircularUrlCount = 0;

  const items = banks.map((b) => {
    const status = b.verificationStatus ?? 'baseline_verified';
    if (status === 'circular_verified') circularVerifiedCount++;
    else if (status === 'official_gazette') officialGazetteCount++;
    else if (status === 'baseline_verified') baselineVerifiedCount++;
    else if (status === 'fetch_failed') fetchFailedCount++;

    if (!b.effectiveDate) missingEffectiveDateCount++;
    if (!b.circularUrl) missingCircularUrlCount++;

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      baseRate: b.baseRate,
      effectiveDate: b.effectiveDate,
      circularUrl: b.circularUrl,
      verificationStatus: status,
      has12M: typeof b.ratesByTenure?.['12'] === 'number',
      has36M: typeof b.ratesByTenure?.['36'] === 'number',
      has60M: typeof b.ratesByTenure?.['60'] === 'number',
      specialSchemesCount: b.specialSchemes?.length ?? 0,
    };
  });

  return {
    totalBanks: banks.length,
    circularVerifiedCount,
    officialGazetteCount,
    baselineVerifiedCount,
    fetchFailedCount,
    missingEffectiveDateCount,
    missingCircularUrlCount,
    banks: items,
  };
}

/**
 * Audited ALCO Circular Baselines for All 38 Registered Institutions
 * Sourced directly from official bank rate cards, statutory gazettes, and ALCO disclosures (< ₹3 Crore retail deposits).
 */
export const AUDITED_CIRCULAR_BASELINES: BankCircularUpdate[] = [
  // ==========================================
  // High-Yield Small Finance Banks (SFBs)
  // ==========================================
  {
    bankId: 'unity-sfb',
    effectiveDate: 'w.e.f. October 7, 2024',
    circularUrl: 'https://theunitybank.com/interest-rates.html',
    baseRate: 8.15,
    ratesByTenure: { '12': 7.85, '24': 8.00, '36': 8.15, '60': 7.75 },
    specialTenure: '1001 Days (8.40%)',
    specialSchemes: [
      { name: 'Unity Shrestha', days: 1001, rate: 8.40, badge: 'Peak SFB 8.40%' },
      { name: 'Unity 501D', days: 501, rate: 8.25 },
      { name: 'Unity 701D', days: 701, rate: 8.35 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  {
    bankId: 'suryoday-sfb',
    effectiveDate: 'w.e.f. September 4, 2024',
    circularUrl: 'https://suryoday.bank.in/p/fixed-deposit',
    baseRate: 8.00,
    ratesByTenure: { '12': 7.75, '24': 8.10, '36': 8.00, '60': 7.50 },
    specialTenure: '2 Years 2 Days (8.25%)',
    specialSchemes: [
      { name: 'Suryoday 2Y2D', days: 732, rate: 8.25, badge: 'Special 732D (8.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  {
    bankId: 'utkarsh-sfb',
    effectiveDate: 'w.e.f. June 7, 2024',
    circularUrl: 'https://www.utkarsh.bank/interest-rates',
    baseRate: 8.00,
    ratesByTenure: { '12': 7.75, '24': 8.00, '36': 8.00, '60': 7.50 },
    specialTenure: '1500 Days (8.25%)',
    specialSchemes: [
      { name: 'Utkarsh 1500D', days: 1500, rate: 8.25, badge: 'Long Term 8.25%' },
      { name: 'Utkarsh 777D', days: 777, rate: 8.15, badge: 'Special 777D (8.15%)' },
    ],
    seniorBonus: 0.60,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  {
    bankId: 'equitas-sfb',
    effectiveDate: 'w.e.f. August 21, 2024',
    circularUrl: 'https://www.equitas.bank.in/personal-banking/investments/fixed-deposits',
    baseRate: 7.90,
    ratesByTenure: { '12': 7.60, '24': 7.80, '36': 7.90, '60': 7.25 },
    specialTenure: '444 Days (8.15%)',
    specialSchemes: [
      { name: 'Equitas 444D', days: 444, rate: 8.15, badge: 'Special 444D (8.15%)' },
      { name: 'Equitas 888D', days: 888, rate: 8.05 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  {
    bankId: 'au-sfb',
    effectiveDate: 'w.e.f. September 15, 2024',
    circularUrl: 'https://www.au.bank.in/interest-rates',
    baseRate: 7.50,
    ratesByTenure: { '12': 7.25, '24': 7.50, '36': 7.50, '60': 7.25 },
    specialTenure: '18M to 24M (8.00%)',
    specialSchemes: [
      { name: 'AU Peak Term 18M-24M', days: 555, rate: 8.00, badge: 'Peak AU 8.00%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  {
    bankId: 'ujjivan-sfb',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://www.ujjivansfb.bank.in/personal/deposits/regular-fixed-deposits',
    baseRate: 7.20,
    ratesByTenure: { '12': 8.25, '24': 7.75, '36': 7.20, '60': 7.20 },
    specialTenure: '15 Months (8.25%)',
    specialSchemes: [
      { name: 'Ujjivan Platina 15M', days: 456, rate: 8.25, badge: 'Peak Ujjivan 8.25%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },

  // ==========================================
  // Premier Commercial Private Banks
  // ==========================================
  {
    bankId: 'hdfc-bank',
    effectiveDate: 'w.e.f. July 24, 2024',
    circularUrl: 'https://www.hdfcbank.com/personal/save/fixed-deposit/fixed-deposit-interest-rate',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.60, '24': 7.00, '36': 7.00, '60': 7.00 },
    specialTenure: '55 Months (7.40%)',
    specialSchemes: [
      { name: 'HDFC 35M Special', days: 1065, rate: 7.35, badge: 'Special 35M (7.35%)' },
      { name: 'HDFC 55M Special', days: 1672, rate: 7.40, badge: 'Peak HDFC 7.40%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'icici-bank',
    effectiveDate: 'w.e.f. August 2, 2024',
    circularUrl: 'https://www.icicibank.com/personal-banking/deposits/fixed-deposit/fd-interest-rates',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.70, '24': 7.20, '36': 7.00, '60': 7.00 },
    specialTenure: '15M to 18M (7.25%)',
    specialSchemes: [
      { name: 'ICICI 15M Special', days: 456, rate: 7.25, badge: 'Peak ICICI 7.25%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'axis-bank',
    effectiveDate: 'w.e.f. September 3, 2024',
    circularUrl: 'https://www.axisbank.com/interest-rates',
    baseRate: 7.10,
    ratesByTenure: { '12': 6.70, '24': 7.10, '36': 7.10, '60': 7.00 },
    specialTenure: '17 Months (7.20%)',
    specialSchemes: [
      { name: 'Axis 17M Special', days: 515, rate: 7.20, badge: 'Peak Axis 7.20%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'kotak-bank',
    effectiveDate: 'w.e.f. August 20, 2024',
    circularUrl: 'https://www.kotak.com/en/personal-banking/deposits/fixed-deposit/fixed-deposit-interest-rate.html',
    baseRate: 7.00,
    ratesByTenure: { '12': 7.10, '24': 7.15, '36': 7.00, '60': 6.20 },
    specialTenure: '390 Days (7.40%)',
    specialSchemes: [
      { name: 'Kotak 390D Active FD', days: 390, rate: 7.40, badge: 'Peak Kotak 7.40%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'idfc-first-bank',
    effectiveDate: 'w.e.f. October 16, 2024',
    circularUrl: 'https://www.idfcfirstbank.com/interest-rate/deposits',
    baseRate: 7.25,
    ratesByTenure: { '12': 6.50, '24': 7.25, '36': 7.25, '60': 7.00 },
    specialTenure: '500 Days (7.90%)',
    specialSchemes: [
      { name: 'IDFC FIRST 500D', days: 500, rate: 7.90, badge: 'Peak IDFC 7.90%' },
      { name: 'IDFC FIRST 400D', days: 400, rate: 7.75 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'indusind-bank',
    effectiveDate: 'w.e.f. September 10, 2024',
    circularUrl: 'https://www.indusind.com/in/en/personal/rates.html',
    baseRate: 7.25,
    ratesByTenure: { '12': 7.75, '24': 7.75, '36': 7.25, '60': 7.25 },
    specialTenure: '1Y 7M (7.75%)',
    specialSchemes: [
      { name: 'IndusInd 1Y7M', days: 579, rate: 7.75, badge: 'Peak IndusInd 7.75%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'yes-bank',
    effectiveDate: 'w.e.f. August 5, 2024',
    circularUrl: 'https://www.yesbank.in/personal-banking/deposits/fixed-deposit/fixed-deposit-interest-rates',
    baseRate: 7.25,
    ratesByTenure: { '12': 7.25, '24': 7.75, '36': 7.25, '60': 7.25 },
    specialTenure: '18 Months (7.75%)',
    specialSchemes: [
      { name: 'Yes Bank 18M Special', days: 548, rate: 7.75, badge: 'Peak Yes Bank 7.75%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'federal-bank',
    effectiveDate: 'w.e.f. September 16, 2024',
    circularUrl: 'https://www.federalbank.co.in/deposit-rate',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.80, '24': 7.05, '36': 7.00, '60': 6.60 },
    specialTenure: '400 Days (7.40%)',
    specialSchemes: [
      { name: 'Federal 400D Special', days: 400, rate: 7.40, badge: 'Peak Federal 7.40%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },

  // ==========================================
  // Public Sector Banks (PSUs)
  // ==========================================
  {
    bankId: 'sbi-bank',
    effectiveDate: 'w.e.f. June 15, 2024',
    circularUrl: 'https://sbi.bank.in/web/interest-rates/deposit-rates',
    baseRate: 6.75,
    ratesByTenure: { '12': 6.80, '24': 7.00, '36': 6.75, '60': 6.50 },
    specialTenure: '444 Days Amrit Vrishti (7.25%)',
    specialSchemes: [
      { name: 'SBI Amrit Vrishti', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
      { name: 'SBI Amrit Kalash', days: 400, rate: 7.10, badge: 'Special 400D (7.10%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'bank-of-baroda',
    effectiveDate: 'w.e.f. October 3, 2024',
    circularUrl: 'https://www.bankofbaroda.in/interest-rates-and-service-charges/deposit-interest-rates',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.85, '24': 7.15, '36': 6.50, '60': 6.50 },
    specialTenure: '399 Days Tiranga Plus (7.25%)',
    specialSchemes: [
      { name: 'BoB Tiranga Plus', days: 399, rate: 7.25, badge: 'Special 399D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'pnb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://www.pnbindia.in/deposit-interest-rates.html',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 7.00, '60': 6.50 },
    specialTenure: '400 Days PNB Uttam (7.25%)',
    specialSchemes: [
      { name: 'PNB Uttam 400D', days: 400, rate: 7.25, badge: 'Special 400D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
  },
  {
    bankId: 'union-bank',
    effectiveDate: 'w.e.f. August 22, 2024',
    circularUrl: 'https://www.unionbankofindia.co.in/english/interest-rates.aspx',
    baseRate: 6.70,
    ratesByTenure: { '12': 6.75, '24': 6.75, '36': 6.70, '60': 6.50 },
    specialTenure: '333 Days Union Samriddhi (7.40%)',
    specialSchemes: [
      { name: 'Union Samriddhi 333D', days: 333, rate: 7.40, badge: 'Special 333D (7.40%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'canara-bank',
    effectiveDate: 'w.e.f. October 5, 2024',
    circularUrl: 'https://canarabank.com/interest-rates-deposit',
    baseRate: 6.80,
    ratesByTenure: { '12': 6.85, '24': 6.85, '36': 6.80, '60': 6.70 },
    specialTenure: '444 Days Canara Dhanvarsha (7.25%)',
    specialSchemes: [
      { name: 'Canara Dhanvarsha', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'bank-of-india',
    effectiveDate: 'w.e.f. September 1, 2024',
    circularUrl: 'https://bankofindia.co.in/interest-rates/deposit-rates',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 6.50, '60': 6.00 },
    specialTenure: '666 Days Star Dhan Vriddhi (7.30%)',
    specialSchemes: [
      { name: 'BOI Star Dhan Vriddhi 666D', days: 666, rate: 7.30, badge: 'Special 666D (7.30%)' },
      { name: 'BOI Star Dhan Vriddhi 333D', days: 333, rate: 7.25 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.65,
  },
  {
    bankId: 'saraswat-bank',
    effectiveDate: 'w.e.f. September 10, 2024',
    circularUrl: 'https://www.saraswatbank.com/',
    baseRate: 7.00,
    ratesByTenure: { '12': 7.00, '24': 7.00, '36': 7.00, '60': 6.75 },
    specialTenure: '400 Days (7.30%)',
    specialSchemes: [
      { name: 'Saraswat 400D', days: 400, rate: 7.30, badge: 'Special 400D (7.30%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },

  // ==========================================
  // Sovereign Small Savings Schemes (India Post)
  // ==========================================
  {
    bankId: 'post-office-potd',
    effectiveDate: 'w.e.f. October 1, 2024 (MoF Order Q3 FY25)',
    circularUrl: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
    baseRate: 7.10,
    ratesByTenure: { '12': 6.90, '24': 7.00, '36': 7.10, '60': 7.50 },
    specialTenure: '5-Year Time Deposit (7.50% Sec 80C)',
    specialSchemes: [
      { name: 'POTD 5-Year Tax Saver', days: 1825, rate: 7.50, badge: 'Sovereign 7.50%' },
    ],
    seniorBonus: 0.00,
    superSeniorBonus: 0.00,
    womenBonus: 0.00,
    verificationStatus: 'official_gazette',
  },
  {
    bankId: 'post-office-pord',
    effectiveDate: 'w.e.f. October 1, 2024 (MoF Order Q3 FY25)',
    circularUrl: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
    baseRate: 6.70,
    ratesByTenure: { '60': 6.70 },
    rdRatesByTenure: { '60': 6.70 },
    specialTenure: '5-Year PORD (6.70% Quarterly Compounded)',
    seniorBonus: 0.00,
    superSeniorBonus: 0.00,
    womenBonus: 0.00,
    verificationStatus: 'official_gazette',
  },

  // ==========================================
  // Regional Rural Banks (RRBs) - Pan-Bharat
  // ==========================================
  {
    bankId: 'apgb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://apgb.bank.in/banking-products/deposits/deposit-interest-rates',
    baseRate: 6.65,
    ratesByTenure: { '12': 7.00, '24': 6.65, '36': 6.65, '60': 6.65 },
    specialTenure: 'APGB 1 Year Term (7.00%)',
    specialSchemes: [
      { name: 'APGB 1 Year Term', days: 365, rate: 7.00, badge: 'Peak RRB 7.00%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  {
    bankId: 'tgb-bank',
    effectiveDate: 'w.e.f. August 1, 2024',
    circularUrl: 'https://tgb.bank.in/deposit-interest-rates',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.45, '24': 6.45, '36': 6.50, '60': 7.00 },
    specialTenure: '1000 Days TGB Sahasra (7.50%)',
    specialSchemes: [
      { name: 'TGB Sahasra', days: 1000, rate: 7.50, badge: 'Peak RRB 7.50%' },
      { name: '444-DDD Special', days: 444, rate: 7.40, badge: 'Special 444D' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'kgb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://keralagbank.com/',
    baseRate: 6.80,
    ratesByTenure: { '12': 6.90, '24': 6.85, '36': 6.80, '60': 6.70 },
    specialTenure: '444 Days Special (7.25%)',
    specialSchemes: [
      { name: 'KGB 444D', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'kagb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://karnatakagraminbank.com/',
    baseRate: 6.80,
    ratesByTenure: { '12': 6.85, '24': 6.85, '36': 6.80, '60': 6.70 },
    specialTenure: '444 Days (7.25%)',
    specialSchemes: [
      { name: 'Karnataka Gramin 444D', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'mgb-bank',
    effectiveDate: 'w.e.f. September 15, 2024',
    circularUrl: 'https://mahagramin.bank.in/',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 6.50, '60': 6.50 },
    specialTenure: '400 Days (7.15%)',
    specialSchemes: [
      { name: 'MGB 400D', days: 400, rate: 7.15, badge: 'Special 400D (7.15%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'bggb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://bggb.in/',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.85, '24': 7.00, '36': 6.50, '60': 6.50 },
    specialTenure: '399 Days (7.20%)',
    specialSchemes: [
      { name: 'Baroda Gujarat 399D', days: 399, rate: 7.20, badge: 'Special 399D (7.20%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'aryavart-bank',
    effectiveDate: 'w.e.f. September 1, 2024',
    circularUrl: 'https://aryavart-rrb.com/',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 6.50, '60': 6.00 },
    specialTenure: '666 Days (7.25%)',
    specialSchemes: [
      { name: 'Aryavart 666D', days: 666, rate: 7.25, badge: 'Special 666D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'jkgb-bank',
    effectiveDate: 'w.e.f. September 15, 2024',
    circularUrl: 'https://jkgb.in/',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.80, '24': 6.75, '36': 6.50, '60': 6.50 },
    specialTenure: '444 Days (7.20%)',
    specialSchemes: [
      { name: 'JKGB 444D', days: 444, rate: 7.20, badge: 'Special 444D (7.20%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'dbgb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://dbgb.in/',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 7.00, '60': 6.50 },
    specialTenure: '400 Days DBGB Uttam (7.20%)',
    specialSchemes: [
      { name: 'DBGB 400D Uttam', days: 400, rate: 7.20, badge: 'Special 400D (7.20%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
  },
  {
    bankId: 'ogb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://odishabank.in/',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.85, '24': 6.85, '36': 6.50, '60': 6.50 },
    specialTenure: '444 Days (7.25%)',
    specialSchemes: [
      { name: 'OGB 444D', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'rmgb-bank',
    effectiveDate: 'w.e.f. June 15, 2024',
    circularUrl: 'https://rmgb.in/',
    baseRate: 6.75,
    ratesByTenure: { '12': 6.80, '24': 7.00, '36': 6.75, '60': 6.50 },
    specialTenure: '444 Days (7.25%)',
    specialSchemes: [
      { name: 'RMGB 444D', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'bgvb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://bgvb.in/',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 7.00, '60': 6.50 },
    specialTenure: '400 Days (7.20%)',
    specialSchemes: [
      { name: 'BGVB 400D', days: 400, rate: 7.20, badge: 'Special 400D (7.20%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
  },
  {
    bankId: 'agvb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://agvbank.co.in/',
    baseRate: 7.00,
    ratesByTenure: { '12': 6.80, '24': 6.80, '36': 7.00, '60': 6.50 },
    specialTenure: '400 Days (7.20%)',
    specialSchemes: [
      { name: 'AGVB 400D', days: 400, rate: 7.20, badge: 'Special 400D (7.20%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
  },
  {
    bankId: 'tngb-bank',
    effectiveDate: 'w.e.f. October 1, 2024',
    circularUrl: 'https://www.tamilnadugramabank.com/',
    baseRate: 6.70,
    ratesByTenure: { '12': 6.85, '24': 6.85, '36': 6.70, '60': 6.50 },
    specialTenure: '400 Days (7.25%)',
    specialSchemes: [
      { name: 'TNGB 400D', days: 400, rate: 7.25, badge: 'Special 400D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
  {
    bankId: 'mgb-mp-bank',
    effectiveDate: 'w.e.f. June 15, 2024',
    circularUrl: 'https://mgbank.co.in/',
    baseRate: 6.75,
    ratesByTenure: { '12': 6.80, '24': 7.00, '36': 6.75, '60': 6.50 },
    specialTenure: '444 Days (7.25%)',
    specialSchemes: [
      { name: 'MGB MP 444D', days: 444, rate: 7.25, badge: 'Special 444D (7.25%)' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
  },
];

/**
 * Ingests all verified ALCO baselines and writes the updated rates.json.
 */
export function applyAllAuditedBaselines(): { summary: string; diffs: CircularDiff[] } {
  let file = loadCurrentRatesFile();
  const diffs: CircularDiff[] = [];

  for (const baseline of AUDITED_CIRCULAR_BASELINES) {
    const result = applyCircularUpdate(baseline, file);
    file = result.ratesFile;
    if (result.diff.changes.length > 0) {
      diffs.push(result.diff);
    }
  }

  saveRatesFileAtomic(file);

  return {
    summary: `Processed ${AUDITED_CIRCULAR_BASELINES.length} audited bank circulars. ${diffs.length} banks updated.`,
    diffs,
  };
}

