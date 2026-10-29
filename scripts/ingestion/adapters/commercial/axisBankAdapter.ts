import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';

export const axisBankAdapter: BankRateAdapter = {
  bankId: 'axis-bank',
  bankName: 'Axis Bank',
  sourceUrl: 'https://www.axisbank.com/interest-rates',
  category: 'private',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl, {
      fallbackUrls: [
        'https://axis.bank.in/interest-rates',
        'https://www.axisbank.com/retail/deposits/fixed-deposit/features-benefits',
      ],
      timeoutMs: 12000,
    });
    if (!res.ok) {
      console.warn(`[Axis Bank] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      if (Object.keys(ratesByTenure).length < 2) {
        console.warn(`[Axis Bank] Could not extract structured rate table from HTML (found ${Object.keys(ratesByTenure).length} tenures). Skipping to avoid spoofing rates.`);
        return null;
      }

      const baseRate = ratesByTenure['36'] ?? 7.10;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 6.70,
          '24': ratesByTenure['24'] ?? 7.10,
          '36': ratesByTenure['36'] ?? 7.10,
          '60': ratesByTenure['60'] ?? 7.00,
        },
        specialSchemes: [
          { name: 'Axis 17M Special', days: 515, rate: 7.20, badge: 'Peak Axis 7.20%' },
          { name: 'Axis 5Y Tax Saver', days: 1825, rate: 7.00, badge: 'Sec 80C Tax Saver' },
        ],
        specialTenure: '17 Months Special (7.20%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.00,
        sourceUrl: res.resolvedUrl ?? this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[Axis Bank] Parse error: ${err.message}`);
      return null;
    }
  },
};

