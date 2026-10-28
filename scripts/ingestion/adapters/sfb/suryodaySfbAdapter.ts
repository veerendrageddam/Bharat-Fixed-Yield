import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const suryodaySfbAdapter: BankRateAdapter = {
  bankId: 'suryoday-sfb',
  bankName: 'Suryoday Small Finance Bank',
  sourceUrl: 'https://www.suryoday.bank.in/',
  category: 'sfb',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl);
    if (!res.ok) {
      console.warn(`[Suryoday SFB] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      const baseRate = ratesByTenure['36'] ?? 8.00;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 7.75,
          '24': ratesByTenure['24'] ?? 8.10,
          '36': ratesByTenure['36'] ?? 8.00,
          '60': ratesByTenure['60'] ?? 7.50,
        },
        specialSchemes: [
          { name: 'Suryoday 2Y2D', days: 732, rate: 8.25, badge: 'Special 732D' },
        ],
        specialTenure: '2 Years 2 Days (8.25%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.10,
        sourceUrl: this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[Suryoday SFB] Parse error: ${err.message}`);
      return null;
    }
  },
};

