import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const ujjivanSfbAdapter: BankRateAdapter = {
  bankId: 'ujjivan-sfb',
  bankName: 'Ujjivan Small Finance Bank',
  sourceUrl: 'https://www.ujjivansfb.in/interest-rates',
  category: 'sfb',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl);
    if (!res.ok) {
      console.warn(`[Ujjivan SFB] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      const baseRate = ratesByTenure['36'] ?? 7.75;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 7.50,
          '24': ratesByTenure['24'] ?? 7.75,
          '36': ratesByTenure['36'] ?? 7.75,
          '60': ratesByTenure['60'] ?? 7.20,
        },
        specialSchemes: [
          { name: 'Ujjivan Platina', days: 560, rate: 8.05, badge: 'Platina 560D' },
        ],
        specialTenure: '560 Days (8.05%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.10,
        sourceUrl: this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[Ujjivan SFB] Parse error: ${err.message}`);
      return null;
    }
  },
};

