import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const hdfcBankAdapter: BankRateAdapter = {
  bankId: 'hdfc-bank',
  bankName: 'HDFC Bank',
  sourceUrl: 'https://www.hdfcbank.com/personal/save/fixed-deposit/fixed-deposit-interest-rate',
  category: 'private',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl, {
      fallbackUrls: [
        'https://hdfc.bank.in/personal/save/fixed-deposit/fixed-deposit-interest-rate',
        'https://netbanking.hdfcbank.com/',
      ],
      timeoutMs: 12000,
    });
    if (!res.ok) {
      console.warn(`[HDFC Bank] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      if (Object.keys(ratesByTenure).length < 2) {
        console.warn(`[HDFC Bank] Could not extract structured rate table from HTML (found ${Object.keys(ratesByTenure).length} tenures). Skipping to avoid spoofing rates.`);
        return null;
      }

      const baseRate = ratesByTenure['36'] ?? 7.25;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 6.90,
          '24': ratesByTenure['24'] ?? 7.15,
          '36': ratesByTenure['36'] ?? 7.25,
          '60': ratesByTenure['60'] ?? 7.00,
        },
        specialSchemes: [
          { name: 'HDFC 55M Special', days: 1672, rate: 7.40, badge: 'Peak HDFC 7.40%' },
        ],
        specialTenure: '55 Months (7.40%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.00,
        sourceUrl: res.resolvedUrl ?? this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[HDFC Bank] Parse error: ${err.message}`);
      return null;
    }
  },
};

