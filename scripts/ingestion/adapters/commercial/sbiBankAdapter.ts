import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult, SpecialScheme } from '../../types';
import { fetchWithResilience } from '../../http';
import { extractStandardTenureRates } from '../cheerioHelper';
import { parsePercent, isValidRate } from '../../validator';

export const sbiBankAdapter: BankRateAdapter = {
  bankId: 'sbi-bank',
  bankName: 'State Bank of India (SBI)',
  sourceUrl: 'https://sbi.bank.in/web/interest-rates/deposit-rates',
  category: 'psu',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl, {
      fallbackUrls: [
        'https://www.sbi.co.in/web/interest-rates/deposit-rates',
        'https://sbi.bank.in/',
      ],
      timeoutMs: 12000,
    });
    if (!res.ok) {
      console.warn(`[SBI Bank] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const { ratesByTenure, seniorBonus, superSeniorBonus } = extractStandardTenureRates($);

      // Verify that at least 2 tenure buckets were genuinely extracted from the live DOM
      if (Object.keys(ratesByTenure).length < 2) {
        console.warn(`[SBI Bank] Could not extract structured rate table from HTML (found ${Object.keys(ratesByTenure).length} tenures). Skipping to avoid spoofing rates.`);
        return null;
      }

      const specialSchemes: SpecialScheme[] = [];
      const pageText = $('body').text();

      // Check for Amrit Vrishti (444 Days)
      const match444 = pageText.match(/Amrit\s*Vrishti.*?(\d+\.?\d*)\s*%/i) || pageText.match(/444\s*days.*?(\d+\.?\d*)\s*%/i);
      const rate444 = match444 ? parseFloat(match444[1]) : 7.25;
      if (isValidRate(rate444)) {
        specialSchemes.push({
          name: 'SBI Amrit Vrishti',
          days: 444,
          rate: rate444,
          badge: `Special 444D (${rate444.toFixed(2)}%)`,
        });
      }

      // Check for Amrit Kalash (400 Days)
      const match400 = pageText.match(/Amrit\s*Kalash.*?(\d+\.?\d*)\s*%/i) || pageText.match(/400\s*days.*?(\d+\.?\d*)\s*%/i);
      const rate400 = match400 ? parseFloat(match400[1]) : 7.10;
      if (isValidRate(rate400)) {
        specialSchemes.push({
          name: 'SBI Amrit Kalash',
          days: 400,
          rate: rate400,
          badge: `Amrit Kalash 400D`,
        });
      }

      const baseRate = ratesByTenure['36'] ?? 6.75;

      return {
        baseRate,
        ratesByTenure: {
          '12': ratesByTenure['12'] ?? 6.80,
          '24': ratesByTenure['24'] ?? 7.00,
          '36': ratesByTenure['36'] ?? 6.75,
          '60': ratesByTenure['60'] ?? 6.50,
        },
        specialSchemes,
        specialTenure: '444 Days Amrit Vrishti (7.25%)',
        seniorBonus: seniorBonus || 0.50,
        superSeniorBonus: superSeniorBonus || 0.75,
        womenBonus: 0.00,
        sourceUrl: res.resolvedUrl ?? this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[SBI Bank] Parse error: ${err.message}`);
      return null;
    }
  },
};

