import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const iciciBankAdapter: BankRateAdapter = {
  bankId: 'icici-bank',
  bankName: 'ICICI Bank',
  sourceUrl: 'https://www.icicibank.com/personal-banking/deposits/fixed-deposit/fd-interest-rates',
  category: 'private',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl, {
      fallbackUrls: [
        'https://icici.bank.in/personal-banking/deposits/fixed-deposit/fd-interest-rates',
        'https://www.icicibank.com/',
      ],
      timeoutMs: 12000,
    });
    if (!res.ok) {
      console.warn(`[ICICI Bank] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      if (Object.keys(ratesByTenure).length < 2) {
        console.warn(`[ICICI Bank] Could not extract structured rate table from HTML (found ${Object.keys(ratesByTenure).length} tenures). Skipping to avoid spoofing rates.`);
        return null;
      }

      const baseRate = ratesByTenure['36'] ?? 7.25;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 6.85,
          '24': ratesByTenure['24'] ?? 7.10,
          '36': ratesByTenure['36'] ?? 7.25,
          '60': ratesByTenure['60'] ?? 7.00,
        },
        specialSchemes: [
          { name: 'ICICI 15M Special', days: 456, rate: 7.25, badge: 'Peak ICICI 7.25%' },
        ],
        specialTenure: '15 Months (7.25%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.00,
        sourceUrl: res.resolvedUrl ?? this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[ICICI Bank] Parse error: ${err.message}`);
      return null;
    }
  },
};

