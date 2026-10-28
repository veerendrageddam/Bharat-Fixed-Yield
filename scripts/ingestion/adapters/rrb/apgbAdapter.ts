import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult, SpecialScheme } from '../../types';
import { fetchWithResilience } from '../../http';
import { parsePercent } from '../../validator';

export const apgbAdapter: BankRateAdapter = {
  bankId: 'apgb-bank',
  bankName: 'Andhra Pradesh Grameena Bank (APGB)',
  sourceUrl: 'https://apgb.bank.in/banking-products/deposits/deposit-interest-rates',
  category: 'rrb',

  async fetchRates(): Promise<ScrapedRateResult | null> {
    const res = await fetchWithResilience(this.sourceUrl);
    if (!res.ok) {
      console.warn(`[APGB] HTTP Error: ${res.error}`);
      return null;
    }

    try {
      const $ = cheerio.load(res.text);
      const ratesByTenure: Record<string, number> = {};
      let seniorBonus = 0.50;
      let superSeniorBonus = 0.75;

      $('table.table tbody tr').each((_, row) => {
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
        console.warn('[APGB] Could not parse rates from table structure.');
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
        sourceUrl: this.sourceUrl,
        lastVerified: new Date().toISOString(),
        verificationStatus: 'live_synced',
      };
    } catch (err: any) {
      console.error(`[APGB] Parse error: ${err.message}`);
      return null;
    }
  },
};

