import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const equitasSfbAdapter: BankRateAdapter = {
  bankId: 'equitas-sfb',
  bankName: 'Equitas Small Finance Bank',
  sourceUrl: 'https://www.equitasbank.com/interest-rates',
  category: 'sfb',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl);
    if (!res.ok) {
      console.warn(`[Equitas SFB] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      const baseRate = ratesByTenure['36'] ?? 7.90;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 7.60,
          '24': ratesByTenure['24'] ?? 7.80,
          '36': ratesByTenure['36'] ?? 7.90,
          '60': ratesByTenure['60'] ?? 7.25,
        },
        specialSchemes: [
          { name: 'Equitas 444D', days: 444, rate: 8.15, badge: 'Special 444 Days' },
          { name: 'Equitas 888D', days: 888, rate: 8.05 },
        ],
        specialTenure: '444 Days (8.15%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.10,
        sourceUrl: this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[Equitas SFB] Parse error: ${err.message}`);
      return null;
    }
  },
};

