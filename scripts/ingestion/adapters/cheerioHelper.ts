import * as cheerio from 'cheerio';
import { parsePercent } from '../validator';

export interface ExtractedRatesSummary {
  ratesByTenure: Record<string, number>;
  seniorBonus: number;
  superSeniorBonus: number;
}

/**
 * Standardizes bank tenure label matching for the 4 core buckets:
 * 12M (1 Year), 24M (2 Years), 36M (3 Years), 60M (5 Years / Tax Saver)
 */
export function extractStandardTenureRates(
  $: cheerio.CheerioAPI,
  tableSelector: string = 'table'
): ExtractedRatesSummary {
  const ratesByTenure: Record<string, number> = {};
  let seniorBonus = 0.50;
  let superSeniorBonus = 0.75;

  $(tableSelector).find('tr').each((_, row) => {
    const cells = $(row).find('td, th');
    if (cells.length < 2) return;

    const period = $(cells[0]).text().trim().toLowerCase();
    const rateText = $(cells[1]).text().trim();
    const rate = parsePercent(rateText);

    if (rate !== null) {
      if ((period.includes('1 year') && !period.includes('above')) || period.includes('12 month') || period.includes('365 day')) {
        ratesByTenure['12'] = rate;
      } else if (period.includes('2 year') || period.includes('24 month') || period.includes('730 day')) {
        ratesByTenure['24'] = rate;
      } else if (period.includes('3 year') || period.includes('36 month') || period.includes('1095 day')) {
        ratesByTenure['36'] = rate;
      } else if (period.includes('5 year') || period.includes('60 month') || period.includes('tax saver')) {
        ratesByTenure['60'] = rate;
      }
    }

    // Check for senior bonus row
    if (period.includes('senior citizen') && !period.includes('super')) {
      const bonusMatch = rateText.match(/(\d+\.?\d*)\s*%/);
      if (bonusMatch) {
        const bonus = parseFloat(bonusMatch[1]);
        if (bonus > 0 && bonus <= 2.0) seniorBonus = bonus;
      }
    } else if (period.includes('super senior')) {
      const bonusMatch = rateText.match(/(\d+\.?\d*)\s*%/);
      if (bonusMatch) {
        const bonus = parseFloat(bonusMatch[1]);
        if (bonus > 0 && bonus <= 2.0) superSeniorBonus = bonus;
      }
    }
  });

  return { ratesByTenure, seniorBonus, superSeniorBonus };
}

