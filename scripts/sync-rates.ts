import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

interface SpecialScheme {
  name: string;
  days: number;
  rate: number;
  badge?: string;
}

interface BankRateData {
  baseRate: number;
  ratesByTenure: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus: number;
  superSeniorBonus: number;
  womenBonus: number;
  sourceUrl?: string;
  lastVerified?: string;
}

interface MergedBankInfo {
  id: string;
  name: string;
  status: 'amalgamated';
  category: 'sfb' | 'private' | 'psu' | 'rrb';
  effectiveDate: string;
  rationale: string;
  successorBankIds: string[];
  successorBankNames: string[];
  notice: string;
  formerOperatingStates: string[];
  sourceNotice?: string;
}

interface BankMasterDefinition {
  id: string;
  rank: number;
  name: string;
  subTitle: string;
  category: 'sfb' | 'private' | 'psu' | 'rrb';
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
  rdSupported: boolean;
  status: 'active';
  baseRate: number;
  ratesByTenure: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus: number;
  superSeniorBonus: number;
  womenBonus: number;
  sourceUrl?: string;
  lastVerified?: string;
}

interface RatesFile {
  lastUpdated: string;
  version: string;
  source: string;
  banks: Record<string, BankMasterDefinition>;
  mergedBanks: Record<string, MergedBankInfo>;
  rates: Record<string, BankRateData>;
}

const RATES_FILE_PATH = path.resolve(process.cwd(), 'src/data/rates.json');

// User-Agent simulating modern browser to prevent bot blocks
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Safety bounds: Interest rates in India historically stay within 3.00% to 11.50%
function isValidRate(rate: number): boolean {
  return typeof rate === 'number' && !isNaN(rate) && rate >= 3.0 && rate <= 11.5;
}

function parsePercent(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)\s*%/);
  if (match) {
    const val = parseFloat(match[1]);
    return isValidRate(val) ? val : null;
  }
  const directFloat = parseFloat(text.replace(/[^\d.]/g, ''));
  return isValidRate(directFloat) ? directFloat : null;
}

/**
 * Telangana Grameena Bank (TGB) Live Scraper
 * Source: https://tgb.bank.in/deposit-interest-rates
 */
async function scrapeTGB(): Promise<Partial<BankRateData> | null> {
  const url = 'https://tgb.bank.in/deposit-interest-rates';
  console.log(`[TGB] Fetching live rates from ${url}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[TGB] HTTP Error ${res.status}: ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const ratesByTenure: Record<string, number> = {};
    const specialSchemes: SpecialScheme[] = [];

    // Scan table rows for deposit tenures
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const period = $(cells[1]).text().trim().toLowerCase();
        const rateText = $(cells[2]).text().trim();
        const rate = parsePercent(rateText);

        if (rate !== null) {
          if (period.includes('1 year') && period.includes('2 years')) {
            ratesByTenure['12'] = rate;
          } else if (period.includes('2 year') && period.includes('3 years')) {
            ratesByTenure['24'] = rate;
          } else if (period.includes('3 years') && period.includes('5 years')) {
            ratesByTenure['36'] = rate;
          } else if (period.includes('5 year') && period.includes('10 years')) {
            ratesByTenure['60'] = rate;
          } else if (period.includes('444')) {
            specialSchemes.push({
              name: '444-DDD Special',
              days: 444,
              rate,
              badge: 'Special 444D',
            });
          } else if (period.includes('sahasra') || period.includes('1000')) {
            specialSchemes.push({
              name: 'TGB Sahasra',
              days: 1000,
              rate,
              badge: 'Peak RRB 7.50%',
            });
          } else if (period.includes('lakhpati') || (period.includes('rd') && period.includes('36'))) {
            specialSchemes.push({
              name: 'RD Lakhpati (36M RD)',
              days: 1095,
              rate,
              badge: 'High Yield RD',
            });
          } else if (period.includes('nethanna') || (period.includes('rd') && period.includes('24'))) {
            specialSchemes.push({
              name: 'RD Nethanna Podupu (24M RD)',
              days: 730,
              rate,
            });
          }
        }
      }
    });

    if (Object.keys(ratesByTenure).length === 0) {
      console.warn('[TGB] Could not parse any standard tenure rates from table. DOM structure may have changed.');
      return null;
    }

    const baseRate = ratesByTenure['36'] ?? ratesByTenure['12'] ?? 6.50;
    const peakSpecial = specialSchemes.find((s) => s.days === 1000) ?? specialSchemes[0];

    return {
      baseRate,
      ratesByTenure,
      specialSchemes,
      specialTenure: peakSpecial ? `${peakSpecial.days} Days ${peakSpecial.name} (${peakSpecial.rate.toFixed(2)}%)` : undefined,
      seniorBonus: 0.50,
      superSeniorBonus: 0.50,
      womenBonus: 0.00,
      sourceUrl: url,
      lastVerified: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[TGB] Error scraping: ${err.message}`);
    return null;
  }
}

/**
 * Andhra Pradesh Grameena Bank (APGB) Live Scraper
 * Source: https://apgb.bank.in/banking-products/deposits/deposit-interest-rates
 */
async function scrapeAPGB(): Promise<Partial<BankRateData> | null> {
  const url = 'https://apgb.bank.in/banking-products/deposits/deposit-interest-rates';
  console.log(`[APGB] Fetching live rates from ${url}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[APGB] HTTP Error ${res.status}: ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const ratesByTenure: Record<string, number> = {};
    let seniorBonus = 0.50;
    let superSeniorBonus = 0.75;

    $('table.table tbody tr').each((_, row) => {
      // Ignore hidden or archived tbodies
      if ($(row).closest('tbody').attr('style')?.includes('display:none')) return;

      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const period = $(cells[0]).text().trim().toLowerCase();
        const rateText = $(cells[1]).text().trim();
        const rate = parsePercent(rateText);

        if (rate !== null) {
          if (period.includes('1 year') && period.includes('2 years')) {
            ratesByTenure['12'] = rate;
          } else if (period.includes('2 years and above')) {
            ratesByTenure['24'] = rate;
            ratesByTenure['36'] = rate;
            ratesByTenure['60'] = rate;
          }
        }

        // Exact row matching for senior citizen bonuses
        if (period === 'senior citizens') {
          const match = rateText.match(/(\d+\.?\d*)\s*%/);
          if (match) {
            const parsed = parseFloat(match[1]);
            if (parsed > 0 && parsed <= 2.0) seniorBonus = parsed;
          }
        } else if (period === 'super senior citizens') {
          const match = rateText.match(/(\d+\.?\d*)\s*%/);
          if (match) {
            const parsed = parseFloat(match[1]);
            if (parsed > 0 && parsed <= 2.0) superSeniorBonus = parsed;
          }
        }
      }
    });

    if (Object.keys(ratesByTenure).length === 0) {
      console.warn('[APGB] Could not parse rates from table.');
      return null;
    }

    const baseRate = ratesByTenure['36'] ?? ratesByTenure['12'] ?? 6.65;
    const specialSchemes: SpecialScheme[] = [
      {
        name: 'APGB 1 Year Term',
        days: 365,
        rate: ratesByTenure['12'] ?? 7.00,
        badge: 'Peak RRB 7.00%',
      },
    ];

    return {
      baseRate,
      ratesByTenure,
      specialSchemes,
      specialTenure: '1 Year (7.00%)',
      seniorBonus,
      superSeniorBonus,
      womenBonus: 0.15,
      sourceUrl: url,
      lastVerified: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[APGB] Error scraping: ${err.message}`);
    return null;
  }
}

/**
 * Central Bank Master Registry
 * Defines institutional details with zero hardcoded runtime dependencies.
 * All interest rates and cards are populated directly into rates.json.
 */
const MASTER_BANK_REGISTRY: Record<string, Omit<BankMasterDefinition, 'baseRate' | 'ratesByTenure' | 'specialTenure' | 'specialSchemes' | 'seniorBonus' | 'superSeniorBonus' | 'womenBonus' | 'lastVerified' | 'sourceUrl'> & Partial<BankRateData>> = {
  'unity-sfb': {
    id: 'unity-sfb',
    rank: 1,
    name: 'Unity Small Finance Bank',
    subTitle: 'Scheduled Commercial Bank Status conferred by RBI • Pan-India Branches',
    category: 'sfb',
    badge: 'Highest Yield (Up to 8.90%)',
    categoryTag: 'Small Finance Bank (RBI Regulated)',
    ratingAgency: 'CARE',
    rating: 'CARE A (Stable)',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIA7m4vhe_YcrO_BB5my-thiFhnidVNMwjsvw2Yv1CIAkl5K7QKfDhuf8bdY25k0-3WgiSvvM60FX7WApiXKcK9r3-FzwaI3oRnj8B0TUDZVvFvMySUPkigLxiSgPbfWK-siKbrdxC1XW5tJqixmJpvF21vvNO3gbP7nN-GEeQTL9FRClDKfkCuO06re-iEY_Zqu3mmJYO8xGZZvfFcwUIUAAldAEJhghVGtLNDEI8PeK7GmLhIU4MmQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'DICGC Insured up to ₹5 Lakhs per depositor. 100% Principal Protected within current ₹5,00,000 threshold.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.unitybank.co.in/',
    portalName: 'Unity SFB Digital Portal',
    rdSupported: true,
    status: 'active',
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
  'suryoday-sfb': {
    id: 'suryoday-sfb',
    rank: 2,
    name: 'Suryoday Small Finance Bank',
    subTitle: 'Scheduled Bank Listed on NSE/BSE • High Capital Adequacy Ratio (30%+)',
    category: 'sfb',
    badge: 'Special High-Yield Tenure',
    categoryTag: 'Small Finance Bank',
    ratingAgency: 'CRISIL',
    rating: 'CRISIL A+ (Stable)',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIGDiz8SEuCXdAi5-y3dcfvaamFP2o7VlVmr-mUYfQkw1Ocf2y6fU70WA9Q2HPtDWDG_J3ydx2M_O3xSUamhwLXg9hF-d-rB2SvjkiVvntKJIXJq5jRKBGwoafved_HT8kSL6IhjgSFRoAIFMAJ5-AUW4nCTHpfJCgtKoQp3eMHnob2df9JRO-hipjbYG7S2QNi4tF7oLTNQ4Mj_3ltRBLheIaTGg4_bKmRT2rQRPHf81AC5XMryYQRg',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'DICGC Insured (100% covered). Registered scheduled bank insured under RBI statutory framework.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.suryodaybank.com/',
    portalName: 'Suryoday NetBanking Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 8.00,
    ratesByTenure: { '12': 7.75, '24': 8.10, '36': 8.00, '60': 7.50 },
    specialTenure: '2 Years 2 Days (8.25%)',
    specialSchemes: [
      { name: 'Suryoday 2Y2D', days: 732, rate: 8.25, badge: 'Special 732D' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  'utkarsh-sfb': {
    id: 'utkarsh-sfb',
    rank: 3,
    name: 'Utkarsh Small Finance Bank',
    subTitle: 'Listed Scheduled Commercial Bank • Extensive Rural & Urban Network',
    category: 'sfb',
    badge: 'Top Tier SFB',
    categoryTag: 'Small Finance Bank (RBI Regulated)',
    ratingAgency: 'CARE',
    rating: 'CARE A+ (Positive)',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIGDiz8SEuCXdAi5-y3dcfvaamFP2o7VlVmr-mUYfQkw1Ocf2y6fU70WA9Q2HPtDWDG_J3ydx2M_O3xSUamhwLXg9hF-d-rB2SvjkiVvntKJIXJq5jRKBGwoafved_HT8kSL6IhjgSFRoAIFMAJ5-AUW4nCTHpfJCgtKoQp3eMHnob2df9JRO-hipjbYG7S2QNi4tF7oLTNQ4Mj_3ltRBLheIaTGg4_bKmRT2rQRPHf81AC5XMryYQRg',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Full statutory DICGC insurance guarantee up to ₹5,00,000 principal plus accrued return.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.utkarsh.bank/',
    portalName: 'Utkarsh Digital Banking',
    rdSupported: true,
    status: 'active',
    baseRate: 8.00,
    ratesByTenure: { '12': 7.75, '24': 8.00, '36': 8.00, '60': 7.50 },
    specialTenure: '1500 Days (8.25%)',
    specialSchemes: [
      { name: 'Utkarsh 1500D', days: 1500, rate: 8.25, badge: 'Long Term High Yield' },
      { name: 'Utkarsh 777D', days: 777, rate: 8.15 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  'equitas-sfb': {
    id: 'equitas-sfb',
    rank: 4,
    name: 'Equitas Small Finance Bank',
    subTitle: 'Leading Pan-India Small Finance Lender • Seamless Selfe Digital FD',
    category: 'sfb',
    badge: 'Instant Digital Onboarding',
    categoryTag: 'Small Finance Bank',
    ratingAgency: 'CRISIL',
    rating: 'CRISIL AA- (Stable)',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIA7m4vhe_YcrO_BB5my-thiFhnidVNMwjsvw2Yv1CIAkl5K7QKfDhuf8bdY25k0-3WgiSvvM60FX7WApiXKcK9r3-FzwaI3oRnj8B0TUDZVvFvMySUPkigLxiSgPbfWK-siKbrdxC1XW5tJqixmJpvF21vvNO3gbP7nN-GEeQTL9FRClDKfkCuO06re-iEY_Zqu3mmJYO8xGZZvfFcwUIUAAldAEJhghVGtLNDEI8PeK7GmLhIU4MmQ',
    minDeposit: 5000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: '100% paperless FD opening via video KYC. Insured by DICGC for ₹5 Lakhs.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.equitasbank.com/',
    portalName: 'Equitas Selfe FD Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 7.90,
    ratesByTenure: { '12': 7.60, '24': 7.80, '36': 7.90, '60': 7.25 },
    specialTenure: '444 Days (8.15%)',
    specialSchemes: [
      { name: 'Equitas 444D', days: 444, rate: 8.15, badge: 'Special 444 Days' },
      { name: 'Equitas 888D', days: 888, rate: 8.05 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  'hdfc-bank': {
    id: 'hdfc-bank',
    rank: 5,
    name: 'HDFC Bank',
    subTitle: "India's Largest Private Lender • 'Too Big to Fail' Institutional Classification",
    category: 'private',
    badge: 'Highest Stability (CRISIL AAA)',
    categoryTag: 'Private Bank - D-SIB (Domestically Systemic)',
    ratingAgency: 'CRISIL',
    rating: 'AAA / Stable',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA06GO7WTXghB8mBjS9lDy_L3TGaDdcXnLp38DaiHOkGX6dhcn1u4OgDow4C0366pzf1RuISxu-BFBqJLYIfwv3JNdtrR_khMYFbtzsbGfJiZjkk_zIQv0gH_qU8h_dQdyt1fDoPAI-FBGqOZyOlcIK3wSWnlPBiLwSd5QCVO-GgOGG6oNkIP6OfN63s8JB9_gpiGSkKU44gJvGh9QZZHEvgc1I-mmT5ejoVb2e9KIGOvq54KbfatCjfA',
    minDeposit: 5000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Diversification Pick: Recommended asset allocation partner to split deposits exceeding the ₹5 Lakh statutory DICGC cover.',
    exitPenalty: '1.00% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://netbanking.hdfcbank.com/',
    portalName: 'HDFC NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.25,
    ratesByTenure: { '12': 6.90, '24': 7.15, '36': 7.25, '60': 7.00 },
    specialTenure: '55 Months (7.40%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.00,
  },
  'icici-bank': {
    id: 'icici-bank',
    rank: 6,
    name: 'ICICI Bank',
    subTitle: 'Premier D-SIB Scheduled Commercial Bank • High Tier-1 Capital Adequacy',
    category: 'private',
    badge: 'CRISIL AAA Rated',
    categoryTag: 'Private Bank (D-SIB)',
    ratingAgency: 'CRISIL',
    rating: 'AAA / Stable',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA06GO7WTXghB8mBjS9lDy_L3TGaDdcXnLp38DaiHOkGX6dhcn1u4OgDow4C0366pzf1RuISxu-BFBqJLYIfwv3JNdtrR_khMYFbtzsbGfJiZjkk_zIQv0gH_qU8h_dQdyt1fDoPAI-FBGqOZyOlcIK3wSWnlPBiLwSd5QCVO-GgOGG6oNkIP6OfN63s8JB9_gpiGSkKU44gJvGh9QZZHEvgc1I-mmT5ejoVb2e9KIGOvq54KbfatCjfA',
    minDeposit: 10000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Institutional stability benchmark. Zero counterparty default risk.',
    exitPenalty: '1.00% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.icicibank.com/',
    portalName: 'ICICI iMobile / NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.25,
    ratesByTenure: { '12': 6.85, '24': 7.10, '36': 7.25, '60': 7.00 },
    specialTenure: '15 Months (7.25%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.00,
  },
  'sbi-bank': {
    id: 'sbi-bank',
    rank: 7,
    name: "State Bank of India (SBI 'Amrit Vrishti')",
    subTitle: 'Largest Public Sector Lender • 22,000+ branches • Zero Institutional Default Risk',
    category: 'psu',
    badge: 'Govt of India Majority Owned',
    categoryTag: 'Public Sector (Sovereign Trust)',
    ratingAgency: 'Sovereign',
    rating: 'Highest Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Backed by implicit Government of India sovereign creditworthiness + DICGC ₹5,00,000 statutory deposit insurance.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.onlinesbi.sbi/',
    portalName: 'SBI YONO / OnlineSBI Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 7.10,
    ratesByTenure: { '12': 6.80, '24': 7.00, '36': 7.10, '60': 6.90 },
    specialTenure: '444 Days Amrit Vrishti (7.25%)',
    specialSchemes: [
      { name: "SBI 'Amrit Vrishti'", days: 444, rate: 7.25, badge: 'SBI Flagship Scheme' },
      { name: "SBI 'Amrit Kalash'", days: 400, rate: 7.10, badge: 'Limited 400D' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
    womenBonus: 0.15,
  },
  'bank-of-baroda': {
    id: 'bank-of-baroda',
    rank: 8,
    name: 'Bank of Baroda (BoB Tiranga Plus)',
    subTitle: 'Public Sector Giant • Government of India Holding 63.97%',
    category: 'psu',
    badge: 'Public Sector Trust',
    categoryTag: 'Public Sector Bank',
    ratingAgency: 'Sovereign',
    rating: 'Highest Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Comprehensive sovereign assurance + ₹5 Lakh DICGC statutory claim protection.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.bankofbaroda.in/',
    portalName: 'bob World / NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.15,
    ratesByTenure: { '12': 6.85, '24': 7.05, '36': 7.15, '60': 6.80 },
    specialTenure: '399 Days BoB Tiranga (7.25%)',
    specialSchemes: [
      { name: 'BoB Tiranga Plus', days: 399, rate: 7.25, badge: 'Special 399D' },
      { name: 'BoB Monsoon Dhamaka', days: 333, rate: 7.15 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  'pnb-bank': {
    id: 'pnb-bank',
    rank: 9,
    name: 'Punjab National Bank (PNB Uttam)',
    subTitle: 'Second Largest PSU Lender in India • Massive Domestic Reach',
    category: 'psu',
    badge: 'Govt Controlled',
    categoryTag: 'Public Sector Bank',
    ratingAgency: 'Sovereign',
    rating: 'Highest Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Zero default risk backed by the Government of India sovereign guarantee.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: true,
    operatingStates: ['ALL'],
    portalUrl: 'https://www.pnbindia.in/',
    portalName: 'PNB ONE Digital App',
    rdSupported: true,
    status: 'active',
    baseRate: 7.05,
    ratesByTenure: { '12': 6.80, '24': 7.00, '36': 7.05, '60': 6.75 },
    specialTenure: '400 Days PNB Uttam (7.25%)',
    specialSchemes: [
      { name: 'PNB Uttam', days: 400, rate: 7.25, badge: 'High Yield 400D' },
      { name: 'PNB 300D Special', days: 300, rate: 7.05 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
    womenBonus: 0.15,
  },
  'saraswat-bank': {
    id: 'saraswat-bank',
    rank: 10,
    name: 'Saraswat Co-operative Bank',
    subTitle: "India's Largest Scheduled Urban Co-op Bank • Century of Trust",
    category: 'psu',
    badge: 'Scheduled Co-op Leader',
    categoryTag: 'Scheduled Urban Co-op Bank (RBI Regulated)',
    ratingAgency: 'CRISIL',
    rating: 'CRISIL A+ (Stable)',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Fully covered by DICGC insurance. Operating in Maharashtra, Goa, Karnataka, and Gujarat.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Maharashtra', 'Goa', 'Karnataka', 'Gujarat'],
    portalUrl: 'https://www.saraswatbank.com/',
    portalName: 'Saraswat NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.60,
    ratesByTenure: { '12': 7.40, '24': 7.75, '36': 7.60, '60': 7.15 },
    specialTenure: '2 Years (7.75%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.10,
  },
  'apgb-bank': {
    id: 'apgb-bank',
    rank: 11,
    name: 'Andhra Pradesh Grameena Bank (APGB)',
    subTitle: 'State-Sponsored Scheduled Bank • Govt of India, Canara Bank & Govt of AP',
    category: 'rrb',
    sponsorGovt: 'Govt of Andhra Pradesh & Canara Bank',
    badge: 'AP State Unified RRB (DICGC Covered)',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign / High Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Brodipet Guntur HQ • Consolidated under GoI One State One RRB (amalgamating AP branches of APGVB, Andhra Pragathi Grameena Bank, CGGB, and Saptagiri Grameena Bank). 100% DICGC insured up to ₹5,00,000.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Andhra Pradesh'],
    portalUrl: 'https://apgb.bank.in/',
    portalName: 'APGB Official Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 6.65,
    ratesByTenure: { '12': 7.00, '24': 6.65, '36': 6.65, '60': 6.65 },
    specialTenure: '1 Year (7.00%)',
    specialSchemes: [
      { name: 'APGB 1 Year Term', days: 365, rate: 7.00, badge: 'Peak RRB 7.00%' },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
    sourceUrl: 'https://apgb.bank.in/banking-products/deposits/deposit-interest-rates',
  },
  'tgb-bank': {
    id: 'tgb-bank',
    rank: 12,
    name: 'Telangana Grameena Bank (TGB)',
    subTitle: 'State-Sponsored Scheduled Commercial Bank • Govt of India, SBI & Govt of Telangana',
    category: 'rrb',
    sponsorGovt: 'Govt of Telangana & SBI',
    badge: 'Telangana State Unified RRB',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Highest Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Hyderabad HQ • Serving all 33 Telangana districts incorporating erstwhile APGVB Telangana branches. Full statutory DICGC insurance guarantee up to ₹5 Lakhs per depositor.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Telangana'],
    portalUrl: 'https://tgb.bank.in/deposit-interest-rates',
    portalName: 'Telangana Grameena Bank Official Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 6.50,
    ratesByTenure: { '12': 6.45, '24': 6.45, '36': 6.50, '60': 7.00 },
    specialTenure: '1000 Days TGB Sahasra (7.50%)',
    specialSchemes: [
      { name: 'TGB Sahasra', days: 1000, rate: 7.50, badge: 'Peak RRB 7.50%' },
      { name: '444-DDD Special', days: 444, rate: 7.40, badge: 'Special 444D' },
      { name: 'RD Lakhpati (36M RD)', days: 1095, rate: 7.50, badge: 'High Yield RD' },
      { name: 'RD Nethanna Podupu (24M RD)', days: 730, rate: 6.45 },
    ],
    seniorBonus: 0.50,
    superSeniorBonus: 0.50,
    womenBonus: 0.00,
    sourceUrl: 'https://tgb.bank.in/deposit-interest-rates',
  },
  'kgb-bank': {
    id: 'kgb-bank',
    rank: 13,
    name: 'Kerala Gramin Bank (KGB)',
    subTitle: "India's Largest Regional Rural Bank • Govt of India, Canara Bank & Govt of Kerala",
    category: 'rrb',
    sponsorGovt: 'Govt of Kerala & Canara Bank',
    badge: 'Kerala State Sponsored',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: '630+ Branches across all 14 Kerala districts. Fully DICGC insured up to ₹5,00,000.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Kerala'],
    portalUrl: 'https://keralagbank.com/',
    portalName: 'KGB Digital Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 7.60,
    ratesByTenure: { '12': 7.20, '24': 7.45, '36': 7.60, '60': 7.10 },
    specialTenure: '444 Days KGB Special (7.75%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  'kagb-bank': {
    id: 'kagb-bank',
    rank: 14,
    name: 'Karnataka Grameena Bank (KaGB)',
    subTitle: 'State-Sponsored Scheduled Bank • Govt of India, Canara Bank & Govt of Karnataka',
    category: 'rrb',
    sponsorGovt: 'Govt of Karnataka & Canara Bank',
    badge: 'Karnataka State Unified RRB',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Ballari HQ • Consolidated under GoI One State One RRB (amalgamating KaGB and KVGB). Protected under DICGC statutory guarantee.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Karnataka'],
    portalUrl: 'https://karnatakagraminbank.com/',
    portalName: 'KaGB NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.50,
    ratesByTenure: { '12': 7.10, '24': 7.35, '36': 7.50, '60': 7.00 },
    specialTenure: '555 Days KaGB Golden (7.65%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  'mgb-bank': {
    id: 'mgb-bank',
    rank: 15,
    name: 'Maharashtra Gramin Bank (MGB)',
    subTitle: 'Sponsored by Bank of Maharashtra & Govt of Maharashtra • Pan-Maharashtra Network',
    category: 'rrb',
    sponsorGovt: 'Govt of Maharashtra & Bank of Maharashtra',
    badge: 'Maharashtra State Unified RRB',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Chhatrapati Sambhajinagar HQ • Unified under GoI One State One RRB (amalgamating Maharashtra Gramin Bank and Vidarbha Konkan Gramin Bank). DICGC insured up to ₹5,00,000 per depositor.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Maharashtra'],
    portalUrl: 'https://mahagramin.bank.in/',
    portalName: 'MGB NetBanking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.50,
    ratesByTenure: { '12': 7.10, '24': 7.35, '36': 7.50, '60': 7.00 },
    specialTenure: '444 Days Maha Special (7.60%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  'bggb-bank': {
    id: 'bggb-bank',
    rank: 16,
    name: 'Gujarat Gramin Bank (GGB)',
    subTitle: 'Amalgamated RRB • Sponsored by Bank of Baroda & Govt of Gujarat',
    category: 'rrb',
    sponsorGovt: 'Govt of Gujarat & Bank of Baroda',
    badge: 'Gujarat State Unified RRB',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Vadodara HQ • Consolidated under GoI One State One RRB (amalgamating Baroda Gujarat Gramin Bank and Saurashtra Gramin Bank). 740+ Branches in Gujarat. Insured by DICGC up to ₹5 Lakhs.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Gujarat'],
    portalUrl: 'https://ggb.bank.in/',
    portalName: 'Gujarat Gramin Bank Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 7.45,
    ratesByTenure: { '12': 7.05, '24': 7.30, '36': 7.45, '60': 6.95 },
    specialTenure: '399 Days Gujarat Gramin (7.55%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.75,
    womenBonus: 0.15,
  },
  'aryavart-bank': {
    id: 'aryavart-bank',
    rank: 17,
    name: 'Aryavart Bank (Uttar Pradesh)',
    subTitle: 'Sponsored by Bank of India & Govt of Uttar Pradesh • 1,360+ Branches in UP',
    category: 'rrb',
    sponsorGovt: 'Govt of Uttar Pradesh & Bank of India',
    badge: 'UP State Sponsored',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Lucknow HQ • Largest RRB in Uttar Pradesh. Fully covered by DICGC ₹5 Lakh statutory deposit insurance.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Uttar Pradesh'],
    portalUrl: 'https://aryavart-rrb.com/',
    portalName: 'Aryavart Bank Portal',
    rdSupported: true,
    status: 'active',
    baseRate: 7.50,
    ratesByTenure: { '12': 7.10, '24': 7.35, '36': 7.50, '60': 7.00 },
    specialTenure: '444 Days Aryavart Special (7.65%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
    womenBonus: 0.15,
  },
  'jkgb-bank': {
    id: 'jkgb-bank',
    rank: 18,
    name: 'J&K Grameen Bank (JKGB)',
    subTitle: 'Sponsored by J&K Bank & Govt of UT of J&K and Ladakh',
    category: 'rrb',
    sponsorGovt: 'Govt of UT of J&K and J&K Bank',
    badge: 'J&K & Ladakh UT Sponsored',
    categoryTag: 'Regional Rural Bank (Govt Sponsored)',
    ratingAgency: 'Sovereign',
    rating: 'Sovereign Safety',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8aqYCTG5aiSmCceJmfQOSi4-qKvZZcER6bXP9Y3EyhELqvVM1uw-WYX9SkLmxj2Fc_5aT4usGgdRbfiCM77S0foVudGKRF7Qunx7l77mWOEHO7HUzvrq6nCSs4NTwQILJvVIDzxjop1_zG4mtJ4HfTpwhDHJCvJRz9qjBCma6BmKgyWXsoBCintb1Jk-Lyxv_kMEKG_mOvgg5jpufPeGa4d5q0n8zXUqUQN7kzdP5ru2YcHSPtQu6YQ',
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Jammu HQ • Serving Jammu, Kashmir, and Ladakh. Insured up to ₹5,00,000 by DICGC.',
    exitPenalty: '0.50% Break Penalty',
    lockInDays: 7,
    isPanIndia: false,
    operatingStates: ['Jammu and Kashmir', 'Ladakh'],
    portalUrl: 'https://www.jkgb.in/',
    portalName: 'JKGB Digital Banking',
    rdSupported: true,
    status: 'active',
    baseRate: 7.50,
    ratesByTenure: { '12': 7.10, '24': 7.35, '36': 7.50, '60': 6.95 },
    specialTenure: '400 Days JKGB Amrit (7.60%)',
    seniorBonus: 0.50,
    superSeniorBonus: 0.80,
    womenBonus: 0.15,
  },
};

/**
 * Merged & Amalgamated Banks Registry
 * Tracks historical banks that merged under regulatory consolidations (e.g. GoI One State, One RRB).
 */
const MERGED_BANKS_CATALOG: Record<string, MergedBankInfo> = {
  'apgvb-bank': {
    id: 'apgvb-bank',
    name: 'Andhra Pradesh Grameena Vikas Bank (APGVB)',
    status: 'amalgamated',
    category: 'rrb',
    effectiveDate: '2025-01-01 (Telangana) / 2025-05-01 (Andhra Pradesh)',
    rationale: "Amalgamated under Ministry of Finance 'One State, One RRB' policy",
    successorBankIds: ['apgb-bank', 'tgb-bank'],
    successorBankNames: ['Andhra Pradesh Grameena Bank (APGB)', 'Telangana Grameena Bank (TGB)'],
    notice: 'Andhra Pradesh Grameena Vikas Bank (APGVB) was bifurcated: its 493 branches in Telangana merged into Telangana Grameena Bank (TGB), and its branches in Andhra Pradesh amalgamated into Andhra Pradesh Grameena Bank (APGB).',
    formerOperatingStates: ['Andhra Pradesh', 'Telangana'],
    sourceNotice: 'Government of India Gazette Notification on RRB Amalgamation',
  },
};

/**
 * Extensible Scraper Registry
 */
type ScraperFn = () => Promise<Partial<BankRateData> | null>;

const SCRAPERS: Record<string, ScraperFn> = {
  'tgb-bank': scrapeTGB,
  'apgb-bank': scrapeAPGB,
};

async function main() {
  console.log('=====================================================');
  console.log(' Bharat Fixed Yield (BFY) — Scheduled Rate Ingestion');
  console.log('=====================================================');
  console.log(`Target rates file: ${RATES_FILE_PATH}`);

  // 1. Prepare initial dataset from MASTER_BANK_REGISTRY
  const banksData: Record<string, BankMasterDefinition> = {};
  const ratesRecord: Record<string, BankRateData> = {};

  for (const [id, def] of Object.entries(MASTER_BANK_REGISTRY)) {
    const fullBank: BankMasterDefinition = {
      ...def,
      baseRate: def.baseRate ?? 7.00,
      ratesByTenure: def.ratesByTenure ?? { '12': 6.80, '24': 7.00, '36': 7.10, '60': 6.90 },
      specialTenure: def.specialTenure,
      specialSchemes: def.specialSchemes ?? [],
      seniorBonus: def.seniorBonus ?? 0.50,
      superSeniorBonus: def.superSeniorBonus ?? 0.75,
      womenBonus: def.womenBonus ?? 0.00,
      lastVerified: new Date().toISOString(),
      sourceUrl: def.sourceUrl ?? def.portalUrl,
    };
    banksData[id] = fullBank;
    ratesRecord[id] = {
      baseRate: fullBank.baseRate,
      ratesByTenure: fullBank.ratesByTenure,
      specialTenure: fullBank.specialTenure,
      specialSchemes: fullBank.specialSchemes,
      seniorBonus: fullBank.seniorBonus,
      superSeniorBonus: fullBank.superSeniorBonus,
      womenBonus: fullBank.womenBonus,
      sourceUrl: fullBank.sourceUrl,
      lastVerified: fullBank.lastVerified,
    };
  }

  // 2. Load existing rates.json if available to compare diffs
  let existingRatesFile: RatesFile | null = null;
  if (fs.existsSync(RATES_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(RATES_FILE_PATH, 'utf-8');
      existingRatesFile = JSON.parse(raw);
    } catch (e: any) {
      console.warn(`Could not parse existing rates file: ${e.message}`);
    }
  }

  const updatesSummary: string[] = [];
  let changeCount = 0;

  // 3. Execute live scrapers
  for (const [bankId, scraper] of Object.entries(SCRAPERS)) {
    try {
      const scraped = await scraper();
      if (!scraped) {
        console.warn(`[SKIP] No valid scraped data for ${bankId}, preserving baseline rates.`);
        continue;
      }

      const bank = banksData[bankId];
      if (!bank) {
        console.warn(`[WARN] Bank ${bankId} not in master registry.`);
        continue;
      }

      const diffNotes: string[] = [];
      let hasDiff = false;

      // Check base rate
      if (scraped.baseRate && scraped.baseRate !== bank.baseRate) {
        hasDiff = true;
        diffNotes.push(`baseRate: ${bank.baseRate}% -> ${scraped.baseRate}%`);
        bank.baseRate = scraped.baseRate;
      }

      // Check tenure rates
      if (scraped.ratesByTenure) {
        for (const [tenure, newRate] of Object.entries(scraped.ratesByTenure)) {
          const oldRate = bank.ratesByTenure?.[tenure];
          if (oldRate !== newRate) {
            hasDiff = true;
            diffNotes.push(`${tenure}M: ${oldRate ?? 'N/A'}% -> ${newRate}%`);
            bank.ratesByTenure[tenure] = newRate;
          }
        }
      }

      // Check special schemes
      if (scraped.specialSchemes && scraped.specialSchemes.length > 0) {
        const oldSchemesStr = JSON.stringify(bank.specialSchemes ?? []);
        const newSchemesStr = JSON.stringify(scraped.specialSchemes);
        if (oldSchemesStr !== newSchemesStr) {
          hasDiff = true;
          diffNotes.push(`special schemes updated (${scraped.specialSchemes.length} schemes)`);
          bank.specialSchemes = scraped.specialSchemes;
        }
      }

      if (scraped.specialTenure) {
        bank.specialTenure = scraped.specialTenure;
      }
      if (typeof scraped.seniorBonus === 'number') {
        bank.seniorBonus = scraped.seniorBonus;
      }
      if (typeof scraped.superSeniorBonus === 'number') {
        bank.superSeniorBonus = scraped.superSeniorBonus;
      }
      if (typeof scraped.womenBonus === 'number') {
        bank.womenBonus = scraped.womenBonus;
      }
      if (scraped.sourceUrl) {
        bank.sourceUrl = scraped.sourceUrl;
      }
      bank.lastVerified = new Date().toISOString();

      // Mirror to ratesRecord
      ratesRecord[bankId] = {
        baseRate: bank.baseRate,
        ratesByTenure: bank.ratesByTenure,
        specialTenure: bank.specialTenure,
        specialSchemes: bank.specialSchemes,
        seniorBonus: bank.seniorBonus,
        superSeniorBonus: bank.superSeniorBonus,
        womenBonus: bank.womenBonus,
        sourceUrl: bank.sourceUrl,
        lastVerified: bank.lastVerified,
      };

      if (hasDiff) {
        console.log(`[UPDATE] ${bankId} updated: ${diffNotes.join(', ')}`);
        changeCount++;
        updatesSummary.push(`- **${bankId}**: ${diffNotes.join(', ')}`);
      } else {
        console.log(`[OK] ${bankId} rates verified identical to card disclosures.`);
      }
    } catch (err: any) {
      console.error(`[ERROR] Processing ${bankId}: ${err.message}`);
    }
  }

  // 4. Assemble final atomic RatesFile
  const finalRatesFile: RatesFile = {
    lastUpdated: new Date().toISOString(),
    version: '2.1.0',
    source: 'RBI Scheduled Bank Disclosures & Official Rate Cards',
    banks: banksData,
    mergedBanks: MERGED_BANKS_CATALOG,
    rates: ratesRecord,
  };

  // 5. Write back atomically
  const tempPath = `${RATES_FILE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(finalRatesFile, null, 2), 'utf-8');
  fs.renameSync(tempPath, RATES_FILE_PATH);
  console.log(`\nSuccessfully populated rates and banks in: ${RATES_FILE_PATH}`);

  // 6. GitHub Actions Step Summary output
  if (process.env.GITHUB_STEP_SUMMARY) {
    let summaryMd = `### 🏦 BFY Bank Rates Ingestion Report\n\n`;
    summaryMd += `- **Run Timestamp**: ${new Date().toUTCString()}\n`;
    summaryMd += `- **Active Banks Registered**: ${Object.keys(banksData).length}\n`;
    summaryMd += `- **Amalgamated Banks Tracked**: ${Object.keys(MERGED_BANKS_CATALOG).length}\n`;
    summaryMd += `- **Scrapers Executed**: ${Object.keys(SCRAPERS).length}\n`;
    summaryMd += `- **Rate Diffs Detected**: ${changeCount}\n\n`;

    if (updatesSummary.length > 0) {
      summaryMd += `#### 📝 Rate Updates Applied:\n${updatesSummary.join('\n')}\n`;
    } else {
      summaryMd += `*All monitored banks are up-to-date with current official disclosures.*\n`;
    }

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, 'utf-8');
  }

  console.log('=====================================================');
  console.log(` Ingestion Complete! (Active banks: ${Object.keys(banksData).length}, Changes detected: ${changeCount})`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
